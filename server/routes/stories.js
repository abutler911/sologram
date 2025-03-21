// routes/stories.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  getStories,
  getStory,
  createStory,
  getArchivedStories,
  getArchivedStory,
  archiveStory,
  deleteStory,
  deleteArchivedStory,
} = require("../controllers/stories");
const { protect, authorize } = require("../middleware/auth");

// Public routes - anyone can view stories
router.get("/", getStories);
router.get("/:id", getStory);

// Protected routes - requires authentication
router.post("/", protect, upload.array("media", 10), createStory);
router.delete("/:id", protect, deleteStory);
router.put("/:id/archive", protect, archiveStory);

// Archive routes (all protected)
router.get("/archived", protect, getArchivedStories);
router.get("/archived/:id", protect, getArchivedStory);
router.delete("/archived/:id", protect, deleteArchivedStory);

module.exports = router;