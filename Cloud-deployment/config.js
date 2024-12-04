const AWS = require("aws-sdk");

let region = "eu-central-1",
    secret,
    secretName = "cop-dm-secrets"; //<-- Secret Name from AWS

const client = new AWS.SecretsManager({
    region: region,
});

const getAWSAccessCredentials = async () => {
    const data = await client.getSecretValue({ SecretId: secretName }).promise();
    if ("SecretString" in data) {
        secret = JSON.parse(data.SecretString);

        for (const envKey of Object.keys(secret)) {
            process.env[envKey] = secret[envKey];
        }
    }
}

module.exports = {
    getAWSAccessCredentials
}
