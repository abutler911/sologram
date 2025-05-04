// controllers/uploadController.js
const { cloudinary } = require("../config/cloudinary");
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
}).single("file");

// Upload middleware
exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

// Upload file to Cloudinary
exports.uploadToCloudinary = async (req, res) => {
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

    // Convert buffer to base64
    const fileStr = req.file.buffer.toString("base64");
    const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      resource_type: resourceType,
      folder: "sologram", // Keep the same folder as before
    });

    res.status(200).json({
      success: true,
      mediaUrl: result.secure_url,
      cloudinaryId: result.public_id,
      mediaType: resourceType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
};
