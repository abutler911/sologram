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
} = require("../controllers/stories");
const { protect } = require("../middleware/auth");

// Get all active stories
router.get("/", getStories);

// Get a single story
router.get("/:id", getStory);

// Create a new story (protected)
router.post("/", protect, upload.array("media", 10), createStory);

// Archive routes (all protected)
router.get("/archived", protect, getArchivedStories);
router.get("/archived/:id", protect, getArchivedStory);
router.put("/:id/archive", protect, archiveStory);

// Delete a story (protected)
router.delete("/:id", protect, deleteStory);

module.exports = router;
