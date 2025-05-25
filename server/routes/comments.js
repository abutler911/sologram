// routes/comments.js - Express.js routes for comment functionality

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Your auth middleware
const Comment = require("../models/Comment"); // Comment model
const Post = require("../models/Post"); // Post model
const User = require("../models/User"); // User model

// GET /api/posts/:postId/comments - Get all comments for a post
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get comments with pagination
    const comments = await Comment.find({ postId })
      .populate("author", "name username avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add hasLiked field for authenticated users
    const userId = req.user?.id;
    const commentsWithLikeStatus = comments.map((comment) => ({
      ...comment,
      hasLiked: userId ? comment.likes.includes(userId) : false,
      likes: comment.likes.length,
    }));

    res.json({
      comments: commentsWithLikeStatus,
      total: await Comment.countDocuments({ postId }),
      page: parseInt(page),
      totalPages: Math.ceil((await Comment.countDocuments({ postId })) / limit),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/posts/:postId/comments - Add a new comment
router.post("/posts/:postId/comments", auth, async (req, res) => {
  try {
    const { postId } = req.params;
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

// POST /api/:commentId/like - Like/unlike a comment
router.post("/:commentId/like", auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId).populate(
      "author",
      "name username avatar"
    );
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const hasLiked = comment.likes.includes(userId);

    if (hasLiked) {
      // Unlike the comment
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like the comment
      comment.likes.push(userId);
    }

    await comment.save();

    // Return updated comment
    const responseComment = {
      ...comment.toObject(),
      hasLiked: !hasLiked,
      likes: comment.likes.length,
    };

    res.json(responseComment);
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/:commentId - Delete a comment
router.delete("/:commentId", auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user owns the comment or the post
    const post = await Post.findById(comment.postId);
    const canDelete =
      comment.author.toString() === userId || post.author.toString() === userId;

    if (!canDelete) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Delete all replies first
    await Comment.deleteMany({ parentId: commentId });

    // Remove from parent's replies array if it's a reply
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, {
        $pull: { replies: commentId },
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Update post comment count
    const deletedCount = await Comment.countDocuments({
      $or: [{ _id: commentId }, { parentId: commentId }],
    });

    await Post.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -(deletedCount + 1) },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/:commentId/replies - Get replies for a comment
router.get("/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const replies = await Comment.find({ parentId: commentId })
      .populate("author", "name username avatar")
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add hasLiked field for authenticated users
    const userId = req.user?.id;
    const repliesWithLikeStatus = replies.map((reply) => ({
      ...reply,
      hasLiked: userId ? reply.likes.includes(userId) : false,
      likes: reply.likes.length,
    }));

    res.json({
      replies: repliesWithLikeStatus,
      total: await Comment.countDocuments({ parentId: commentId }),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
