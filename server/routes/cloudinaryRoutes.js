const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const cloudinaryController = require("../controllers/cloudinaryController");

// All routes are protected and require admin role
router.use(protect);
router.use(authorize("admin"));

// Get all Cloudinary assets with filtering and pagination
router.get("/", cloudinaryController.getCloudinaryAssets);

// Delete a Cloudinary asset
router.delete("/:publicId", cloudinaryController.deleteCloudinaryAsset);

module.exports = router;
