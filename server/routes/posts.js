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

// Add the missing comments route
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const postId = req.params.id;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    if (text.trim().length > 500) {
      return res
        .status(400)
        .json({ message: "Comment is too long (max 500 characters)" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // If it's a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.postId.toString() !== postId) {
        return res.status(400).json({ message: "Invalid parent comment" });
      }
    }

    // Create new comment
    const comment = new Comment({
      text: text.trim(),
      author: userId,
      postId,
      parentId: parentId || null,
      createdAt: new Date(),
      likes: [],
      replies: [],
    });

    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });

    // If it's a reply, add to parent's replies array
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, {
        $push: { replies: comment._id },
      });
    }

    // Populate author info before sending response
    await comment.populate("author", "name username avatar");

    // Return comment with proper format
    const responseComment = {
      ...comment.toObject(),
      hasLiked: false,
      likes: 0,
    };

    res.status(201).json(responseComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
