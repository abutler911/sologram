// controllers/uploadController.js
const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");
const path = require("path");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname =
      file.originalname &&
      allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    console.log(`File rejected: ${file.originalname}, ${file.mimetype}`);
    cb(new Error(`File type not supported. Allowed: images and videos`));
  },
}).single("file");

// Upload middleware with better error handling
exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("Upload middleware error:", err);
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }

    if (!req.file) {
      console.warn("No file received in upload request");
      return res.status(400).json({
        success: false,
        message: "No file received",
      });
    }

    console.log(
      `File received: ${req.file.originalname}, size: ${req.file.size} bytes`
    );
    next();
  });
};

// Upload file to Cloudinary with better logging
exports.uploadToCloudinary = async (req, res) => {
  console.log("Starting Cloudinary upload");

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Determine resource type (image or video)
    const resourceType = req.file.mimetype.startsWith("video/")
      ? "video"
      : "image";
    console.log(`Uploading ${resourceType}: ${req.file.originalname}`);

    // Convert buffer to base64
    const fileStr = req.file.buffer.toString("base64");
    const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;

    // Upload to Cloudinary
    console.log("Sending to Cloudinary...");
    const result = await cloudinary.uploader.upload(fileUri, {
      resource_type: resourceType,
      folder: "sologram", // Keep the same folder as before
    });

    console.log("Cloudinary upload successful:", result.public_id);

    res.status(200).json({
      success: true,
      mediaUrl: result.secure_url,
      cloudinaryId: result.public_id,
      mediaType: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload to Cloudinary failed",
      error: error.message,
    });
  }
};
