// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const {
  uploadMiddleware,
  uploadToCloudinary,
} = require("../controllers/uploadController");
const { protect } = require("../middleware/auth");

// Route for file uploads - protected with auth middleware
router.post("/", protect, uploadMiddleware, uploadToCloudinary);

module.exports = router;
