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

router.get("/:id/comments/count", async (req, res) => {
  try {
    const { id } = req.params;
    // If you want to validate ObjectId, uncomment the next 3 lines:
    // const { isValidObjectId } = require("mongoose");
    // if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid post id" });

    // Only count non-deleted comments
    const count = await Comment.countDocuments({
      postId: id,
      isDeleted: false,
    });
    // Always return 200 with a number (0 if none)
    return res.status(200).json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to get comment count" });
  }
});

// Protected routes (require authentication)
router.post("/", protect, postCreationLimiter, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);
router.get("/:id/likes/check", protect, checkUserLike);
router.post("/likes/check-batch", protect, checkUserLikesBatch);

module.exports = router;
