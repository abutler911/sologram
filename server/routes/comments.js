// routes/comments.js
const express = require("express");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
const { protect } = require("../middleware/auth");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const router = express.Router();

const isValidId = (id) => mongoose.isValidObjectId(id);
const clean = (s = "") =>
  sanitizeHtml(String(s), { allowedTags: [], allowedAttributes: {} }).trim();

const parsePaging = (req, defaults = { page: 1, limit: 50, max: 100 }) => {
  const page = Math.max(1, parseInt(req.query.page || defaults.page, 10) || 1);
  const limit = Math.min(
    defaults.max,
    Math.max(
      1,
      parseInt(req.query.limit || defaults.limit, 10) || defaults.limit
    )
  );
  return { page, limit };
};

const createCommentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// helper to normalize author on response
const safeAuthor = (a) =>
  a || { _id: null, name: "Unknown", username: "", avatar: null };

// -----------------------------
// LIST COMMENTS FOR A POST
// GET /api/posts/:postId/comments
// -----------------------------
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid post ID" });
    }

    const postExists = await Post.exists({ _id: postId });
    if (!postExists) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const { page, limit } = parsePaging(req, { page: 1, limit: 50, max: 100 });

    const [total, items] = await Promise.all([
      Comment.countDocuments({ postId, isDeleted: false }),
      Comment.find({ postId, isDeleted: false })
        .populate("author", "name username avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const comments = items.map((c) => ({
      ...c,
      author: safeAuthor(c.author),
      hasLiked: uid
        ? (c.likes || []).some((id) => id.toString() === uid)
        : false,
      likes: Array.isArray(c.likes) ? c.likes.length : 0,
    }));

    res.json({
      success: true,
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("Error fetching comments:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// CREATE COMMENT (OR REPLY)
// POST /api/posts/:postId/comments
// -----------------------------
router.post(
  "/posts/:postId/comments",
  protect,
  createCommentLimiter,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { text, parentId } = req.body;
      const userId = req.user.id;

      if (!isValidId(postId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid post ID" });
      }

      const safeText = clean(text);
      if (!safeText) {
        return res
          .status(400)
          .json({ success: false, message: "Comment text is required" });
      }
      if (safeText.length > 500) {
        return res
          .status(400)
          .json({ success: false, message: "Comment is too long (max 500)" });
      }

      const post = await Post.findById(postId).select("_id");
      if (!post) {
        return res
          .status(404)
          .json({ success: false, message: "Post not found" });
      }

      let parent = null;
      if (parentId) {
        if (!isValidId(parentId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid parent comment ID" });
        }
        parent = await Comment.findById(parentId).select("_id postId parentId");
        if (!parent || parent.postId.toString() !== postId) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid parent comment" });
        }
        if (parent.parentId) {
          return res
            .status(400)
            .json({
              success: false,
              message: "Only one-level replies allowed",
            });
        }
      }

      const comment = await Comment.create({
        text: safeText,
        author: userId,
        postId,
        parentId: parent ? parent._id : null,
      });

      // keep post commentCount authoritative — count all comments incl. replies
      await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

      if (parent) {
        await Comment.updateOne(
          { _id: parent._id },
          { $addToSet: { replies: comment._id } }
        );
      }

      await comment.populate("author", "name username avatar");

      const out = {
        ...comment.toObject(),
        author: safeAuthor(comment.author),
        hasLiked: false,
        likes: 0,
      };

      res.status(201).json({ success: true, comment: out });
    } catch (e) {
      console.error("Error creating comment:", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// -----------------------------
// TOGGLE LIKE
// POST /api/comments/:commentId/like
// -----------------------------
router.post("/comments/:commentId/like", protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidId(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    // toggle via addToSet then pull if already there
    const add = await Comment.updateOne(
      { _id: commentId, likes: { $ne: userId } },
      { $addToSet: { likes: userId } }
    );

    if (add.modifiedCount !== 1) {
      await Comment.updateOne({ _id: commentId }, { $pull: { likes: userId } });
    }

    const fresh = await Comment.findById(commentId)
      .populate("author", "name username avatar")
      .lean();

    if (!fresh) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const likedNow = (fresh.likes || []).some((id) => id.toString() === userId);
    const comment = {
      ...fresh,
      author: safeAuthor(fresh.author),
      hasLiked: likedNow,
      likes: Array.isArray(fresh.likes) ? fresh.likes.length : 0,
    };

    res.json({ success: true, comment });
  } catch (e) {
    console.error("Error liking comment:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// -----------------------------
// DELETE COMMENT (+ direct replies)
// DELETE /api/comments/:commentId
// -----------------------------
router.delete("/comments/:commentId", protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidId(commentId)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const isOwner = comment.author.toString() === userId;
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const repliesToDelete = await Comment.countDocuments({
      parentId: commentId,
    }).session(session);

    await Comment.deleteMany({ parentId: commentId }).session(session);
    await Comment.deleteOne({ _id: commentId }).session(session);

    await Post.updateOne(
      { _id: comment.postId },
      { $inc: { commentCount: -(repliesToDelete + 1) } }
    ).session(session);

    if (comment.parentId) {
      await Comment.updateOne(
        { _id: comment.parentId },
        { $pull: { replies: comment._id } }
      ).session(session);
    }

    await session.commitTransaction();
    res.json({ success: true, message: "Comment deleted" });
  } catch (e) {
    await session.abortTransaction();
    console.error("Error deleting comment:", e);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
});

// -----------------------------
// LIST REPLIES
// GET /api/comments/:commentId/replies
// -----------------------------
router.get("/comments/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidId(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const exists = await Comment.exists({ _id: commentId });
    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const { page, limit } = parsePaging(req, { page: 1, limit: 20, max: 100 });

    const [total, items] = await Promise.all([
      Comment.countDocuments({ parentId: commentId, isDeleted: false }),
      Comment.find({ parentId: commentId, isDeleted: false })
        .populate("author", "name username avatar")
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const comments = items.map((r) => ({
      ...r,
      author: safeAuthor(r.author),
      hasLiked: uid
        ? (r.likes || []).some((id) => id.toString() === uid)
        : false,
      likes: Array.isArray(r.likes) ? r.likes.length : 0,
    }));

    res.json({
      success: true,
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("Error fetching replies:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
