const express = require("express");
const router = express.Router();
const { likeLimiter } = require("../middleware/rateLimiter");
const { upload, uploadMultiple } = require("../config/s3");
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  likePost,
} = require("../controllers/posts");

// Routes remain the same
router.get("/", getPosts);
router.get("/search", searchPosts);
router.get("/:id", getPost);
router.post("/", uploadMultiple.array("media", 20), createPost);
router.put("/:id", uploadMultiple.array("media", 20), updatePost);
router.delete("/:id", deletePost);
router.put("/:id/like", likeLimiter, likePost);

module.exports = router;
