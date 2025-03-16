const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up storage for different media types
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sologram',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
    resource_type: 'auto', // auto-detect whether image or video
  },
});

// Create multer upload
const upload = multer({ storage: storage });

// Create multer upload for multiple files
const uploadMultiple = multer({ 
  storage: storage,
  limits: { files: 10 } // Limit to 10 files
});

module.exports = {
  cloudinary,
  upload,
  uploadMultiple
};