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
const { protect } = require("../middleware/auth");

// Regular story routes only
router.get("/", getStories); // List all active stories
router.get("/:id", getStory); // Get a specific story by ID
router.post("/", protect, upload.array("media", 10), createStory); // Create a new story
router.put("/:id/archive", protect, archiveStory); // Archive a story
router.delete("/:id", protect, deleteStory); // Delete a story

module.exports = router;
