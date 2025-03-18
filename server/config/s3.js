const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Configure multer storage
const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `sologram/${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Create multer upload for single file
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowed = allowedFileTypes.test(ext);
    if (isAllowed) {
      return cb(null, true);
    }
    cb(new Error("File type not supported"));
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Create multer upload for multiple files
const uploadMultiple = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowed = allowedFileTypes.test(ext);
    if (isAllowed) {
      return cb(null, true);
    }
    cb(new Error("File type not supported"));
  },
  limits: {
    files: 20,
    fileSize: 100 * 1024 * 1024,
  },
});

// Helper for deleting files from S3
const deleteFile = async (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Helper to get CloudFront URL from S3 key
const getCloudFrontUrl = (key) => {
  if (!key) return null;
  return `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
};

// Extract S3 key from full URL
const getKeyFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (e) {
    return url.split("/").slice(3).join("/"); // Fallback
  }
};

module.exports = {
  s3,
  upload,
  uploadMultiple,
  deleteFile,
  getCloudFrontUrl,
  getKeyFromUrl,
};
