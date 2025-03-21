// routes/stories.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  getStories,
  getStory,
  createStory,
  archiveStory,
  deleteStory,
} = require("../controllers/stories");
const { protect, authorize } = require("../middleware/auth");

// Public routes - anyone can view stories
router.get("/", getStories);
router.get("/:id", getStory);

// Protected routes - requires authentication
router.post("/", protect, upload.array("media", 10), createStory);
router.delete("/:id", protect, deleteStory);
router.put("/:id/archive", protect, archiveStory);

module.exports = router;