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

// Create a new story with increased file size limit (handled by the upload middleware)
router.post("/", protect, upload.array("media", 10), createStory);

router.put("/:id/archive", protect, archiveStory); // Archive a story
router.delete("/:id", protect, deleteStory); // Delete a story

module.exports = router;