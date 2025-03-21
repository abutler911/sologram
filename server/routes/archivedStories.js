// routes/archivedStories.js
const express = require("express");
const router = express.Router();
const {
  getArchivedStories,
  getArchivedStory,
  deleteArchivedStory,
} = require("../controllers/archivedStories");
const { protect, authorize } = require("../middleware/auth");

// All routes here require authentication
router.use(protect);

// GET /api/archived-stories - Get all archived stories
router.get("/", getArchivedStories);

// GET /api/archived-stories/:id - Get a specific archived story
router.get("/:id", getArchivedStory);

// DELETE /api/archived-stories/:id - Delete an archived story
router.delete("/:id", deleteArchivedStory);

// Health check for debugging
router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Archived stories route is working!",
  });
});

module.exports = router;