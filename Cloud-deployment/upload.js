window.onload = function() {
  initS3(); // Initialize S3 on page load
  // Select the logout button using its ID
  const logoutButton = document.getElementById('logoutButton');

  if (logoutButton) {
      // Add a click event listener to the logout button
      logoutButton.addEventListener('click', function() {
          // Clear session storage (e.g., loggedIn status)
          sessionStorage.removeItem("loggedIn");

          // Redirect to the login page (adjust the URL as needed)
          window.location.href = 'index.html';
      });
  }
};
// Replace these values with your own AWS credentials and bucket information
//const AWS_ACCESS_KEY = '';
//const AWS_SECRET_KEY = '';
//const BUCKET_NAME = 'copenhagen-university-trial-data-intermediate';

const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME; 

// Configure AWS SDK
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: 'eu-central-1' // Replace with your desired AWS region
});

let s3;

function initS3() {
  s3 = new AWS.S3();
}

function uploadMedia() {
  if (!s3) {
    initS3();
  }

  const fileInput = document.getElementById('fileToUpload');
  const files = fileInput.files;

  if (files.length === 0) {
    alert('No files selected for upload.');
    return;
  }

  const progressContainer = document.getElementById('progressContainer');
  progressContainer.style.display = 'block';

  const fileList = document.getElementById('fileList');
  fileList.innerHTML = ''; // Clear previous file list

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Create a new row for the file
    const row = document.createElement('tr');
    const statusCell = document.createElement('td');
    const fileNameCell = document.createElement('td');
    const percentageCell = document.createElement('td');

    statusCell.textContent = `Uploading...`;
    fileNameCell.textContent = file.name;
    percentageCell.textContent = `0%`;

    row.appendChild(statusCell);
    row.appendChild(fileNameCell);
    row.appendChild(percentageCell);
    fileList.appendChild(row);

    // Create a multipart upload
    const params = {
      Bucket: BUCKET_NAME,
      Key: file.name,
      ContentType: file.type
    };

    s3.createMultipartUpload(params, (err, data) => {
      if (err) {
        console.log('Error initiating multipart upload:', err);
        statusCell.textContent = 'Error initiating upload';
        return;
      }

      const uploadId = data.UploadId;
      const chunkSize = 100 * 1024 * 1024; // 100 MB
      const numParts = Math.ceil(file.size / chunkSize);

      let totalUploaded = 0;

      const uploadPartPromises = [];
      for (let partNum = 1; partNum <= numParts; partNum++) {
        const start = (partNum - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);

        const uploadPartParams = {
          Bucket: BUCKET_NAME,
          Key: file.name,
          PartNumber: partNum,
          UploadId: uploadId,
          Body: blob
        };

        uploadPartPromises.push(new Promise((resolve, reject) => {
          s3.uploadPart(uploadPartParams).on('httpUploadProgress', (progress) => {
            totalUploaded += progress.loaded;

            // Calculate percentage correctly
            const percentage = Math.round((totalUploaded / file.size) * 100);
            const boundedPercentage = Math.min(percentage, 100);

            statusCell.textContent = `Uploading...`;
            percentageCell.textContent = `${boundedPercentage}%`;
          }).send((err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                ETag: data.ETag,
                PartNumber: partNum
              });
            }
          });
        }));
      }

      // Handle multipart completion or failure
      Promise.all(uploadPartPromises).then(partResults => {
        const completedParts = partResults.map(result => ({
          ETag: result.ETag,
          PartNumber: result.PartNumber
        }));

        const completeParams = {
          Bucket: BUCKET_NAME,
          Key: file.name,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: completedParts
          }
        };

        s3.completeMultipartUpload(completeParams, (err, data) => {
          if (err) {
            console.log('Error completing multipart upload:', err);
            statusCell.textContent = `Failed to upload`;
          } else {
            console.log('File uploaded successfully:', data.Location);
            statusCell.textContent = `Uploaded`;
            percentageCell.textContent = `100%`;
          }
        });
      }).catch(err => {
        console.log('Error uploading parts:', err);
        s3.abortMultipartUpload({
          Bucket: BUCKET_NAME,
          Key: file.name,
          UploadId: uploadId
        }, (abortErr, data) => {
          if (abortErr) {
            console.log('Error aborting multipart upload:', abortErr);
          } else {
            console.log('Multipart upload aborted.');
            statusCell.textContent = `Aborted upload of ${file.name}`;
            percentageCell.textContent = `-`;
          }
        });
      });
    });
  }
}
