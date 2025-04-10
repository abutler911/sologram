const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Image size up to 20MB and video up to 2GB

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 300 * 1024 * 1024;

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"];
const VIDEO_FORMATS = ["mp4", "mov", "avi", "webm"];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = IMAGE_FORMATS.includes(file.mimetype.split("/")[1]);
    const isVideo = VIDEO_FORMATS.includes(file.mimetype.split("/")[1]);
    return {
      folder: "sologram",
      resource_type: "auto",
      format: isImage ? "webp" : "mp4",
      transformation: isImage
        ? [
            { width: 1920, height: 1080, crop: "limit" },
            { quality: "auto:eco" },
            { fetch_format: "auto" },
          ]
        : [
            { width: 1080, height: 720, crop: "limit" },
            { quality: "auto:good" },
          ],
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

const uploadMultiple = multer({
  storage: storage,
  limits: { 
    fileSize: 300 * 1024 * 1024, 
    files: 20 
  },
});

module.exports = {
  cloudinary,
  upload,
  uploadMultiple,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE
};