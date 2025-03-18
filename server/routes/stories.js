const express = require("express");
const router = express.Router();
const { uploadMultiple } = require("../config/s3");
const {
  createStory,
  getFeedStories,
  getUserStories,
  viewStory,
  deleteStory,
} = require("../controllers/stories");
const { protect, authorize } = require("../middleware/auth");

// Admin-only routes for creating/managing content
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadMultiple.array("media", 10),
  createStory
);
router.delete("/:id", protect, authorize("admin"), deleteStory);

// Public routes - anyone can view
router.get("/feed", getFeedStories);
router.get("/user/:userId", getUserStories);

// View tracking could be anonymous or we can track by IP/session if no user account
router.put("/:id/view", viewStory);

module.exports = router;
