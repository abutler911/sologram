// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadMiddleware,
  uploadToCloudinary,
} = require("../controllers/uploadController");

// Route for file uploads - removing authentication temporarily for testing
router.post("/", uploadMiddleware, uploadToCloudinary);

// Add this to your routes/uploadRoutes.js file

// Test route that returns HTML form for testing uploads
router.get("/test", (req, res) => {
  res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Upload Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .result { margin-top: 20px; padding: 10px; border: 1px solid #ccc; display: none; }
        </style>
      </head>
      <body>
        <h2>Upload Test</h2>
        <form id="uploadForm" enctype="multipart/form-data">
          <div>
            <label for="file">Choose file:</label>
            <input type="file" id="file" name="file" accept="image/*,video/*" required>
          </div>
          <div style="margin-top: 10px;">
            <button type="submit">Upload</button>
          </div>
        </form>
        <div id="progress" style="margin-top: 20px; display: none;">
          <div>Uploading... <span id="percent">0</span>%</div>
          <progress id="progressBar" value="0" max="100" style="width: 100%;"></progress>
        </div>
        <div id="result" class="result">
          <h3>Result:</h3>
          <pre id="resultContent"></pre>
        </div>
        <script>
          document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('file');
            const file = fileInput.files[0];
            if (!file) {
              alert('Please select a file');
              return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            const progress = document.getElementById('progress');
            const percent = document.getElementById('percent');
            const progressBar = document.getElementById('progressBar');
            const result = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');
            
            progress.style.display = 'block';
            result.style.display = 'none';
            
            try {
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                onUploadProgress: (e) => {
                  if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded * 100) / e.total);
                    percent.textContent = percentComplete;
                    progressBar.value = percentComplete;
                  }
                }
              });
              
              const data = await response.json();
              
              result.style.display = 'block';
              resultContent.textContent = JSON.stringify(data, null, 2);
              
              if (data.success) {
                // Show the uploaded image/video if successful
                const mediaPreview = document.createElement(data.mediaType === 'video' ? 'video' : 'img');
                mediaPreview.src = data.mediaUrl;
                mediaPreview.style.maxWidth = '100%';
                mediaPreview.style.maxHeight = '300px';
                if (data.mediaType === 'video') {
                  mediaPreview.controls = true;
                }
                
                result.appendChild(document.createElement('hr'));
                result.appendChild(mediaPreview);
              }
            } catch (error) {
              progress.style.display = 'none';
              result.style.display = 'block';
              resultContent.textContent = 'Error: ' + (error.message || 'Unknown error');
            } finally {
              progress.style.display = 'none';
            }
          });
        </script>
      </body>
      </html>
    `);
});

module.exports = router;
