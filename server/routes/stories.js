const express = require("express");
const router = express.Router();
const { upload, uploadMultiple } = require("../config/cloudinary");
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

router.get("/", getStories);

router.get("/:id", getStory);

router.post("/", protect, uploadMultiple.array("media", 20), createStory);

router.get("/archived", protect, getArchivedStories);

router.get("/archived/:id", protect, getArchivedStory);

router.put("/:id/archive", protect, archiveStory);

router.delete("/:id", protect, deleteStory);

module.exports = router;