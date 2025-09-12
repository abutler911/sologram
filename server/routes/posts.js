const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  checkUserLike,
  searchPosts,
  checkUserLikesBatch,
} = require("../controllers/posts");
const { protect } = require("../middleware/auth");
const { postCreationLimiter } = require("../middleware/rateLimiter");

// Import Comment model for the new route
const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Public routes
router.get("/", getPosts);
router.get("/search", searchPosts);
router.get("/:id", getPost);

// Protected routes (require authentication)
router.post("/", protect, postCreationLimiter, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);
router.get("/:id/likes/check", protect, checkUserLike);
router.post("/likes/check-batch", protect, checkUserLikesBatch);

module.exports = router;
