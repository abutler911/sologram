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
const { protect, authorize } = require("../middleware/auth");

router.get("/", getStories);
router.get("/:id", getStory);
router.post(
  "/",
  protect,
  authorize(["admin", "creator"]),
  uploadMultiple.array("media", 20),
  createStory
);
router.get("/archived", protect, getArchivedStories);
router.get("/archived/:id", protect, getArchivedStory);
router.put(
  "/:id/archive",
  protect,
  authorize(["admin", "creator"]),
  archiveStory
);
router.delete("/:id", protect, authorize(["admin", "creator"]), deleteStory);

module.exports = router;
