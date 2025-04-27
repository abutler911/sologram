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
} = require("../controllers/posts");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", getPosts);
router.get("/:id", getPost);
router.get("/search", searchPosts);

// Protected routes (require authentication)
router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost); // Changed from PUT to POST
router.get("/:id/likes/check", protect, checkUserLike);

module.exports = router;
