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

// ✅ Archive routes must be ABOVE the :id route
router.get("/archived", protect, getArchivedStories);
router.get("/archived/:id", protect, getArchivedStory);

// Get all active stories
router.get("/", getStories);

// Get a single story (Must be below `/archived`)
router.get("/:id", getStory);

// Create a new story (protected)
router.post("/", protect, upload.array("media", 10), createStory);

// Archive a story
router.put("/:id/archive", protect, archiveStory);

// Delete a story (protected)
router.delete("/:id", protect, deleteStory);

module.exports = router;
