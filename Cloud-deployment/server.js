import express from 'express';  // Use 'import' instead of 'require'
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 8000;

// To resolve the __dirname issue in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the current directory
app.use(express.static(__dirname));

app.listen(8000, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});


/*const express = require('express');
const app = express();
const port = 8000;
  
  // Serve static files from the current directory
app.use(express.static(__dirname));
 
app.listen(8000, '0.0.0.0', () => {
      console.log('Server is running on http://0.0.0.0:8000');
});
*/