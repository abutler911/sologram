const express = require("express");
const router = express.Router();
const {
  getArchivedStories,
  getArchivedStory,
  deleteArchivedStory,
} = require("../controllers/stories");
const { protect } = require("../middleware/auth");

// Archive routes only
router.get("/", protect, getArchivedStories); // List all archived stories
router.get("/:id", protect, getArchivedStory); // Get a specific archived story
router.delete("/:id", protect, deleteArchivedStory); // Delete an archived story
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Archived stories route is working!",
  });
});

module.exports = router;
