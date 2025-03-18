// routes/stories.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  getStories,
  createStory,
  deleteStory,
} = require("../controllers/stories");
const { protect } = require("../middleware/auth");

router.get("/", getStories);
router.post("/", protect, upload.array("media", 10), createStory);
router.delete("/:id", protect, deleteStory);

module.exports = router;
