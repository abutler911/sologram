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

router.get("/posts/:postId", async (req, res) => {
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

    const [total, comments] = await Promise.all([
      Comment.countDocuments({ postId, isDeleted: false }),
      Comment.find({ postId, isDeleted: false })
        .populate("author", "name username avatar")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const mapped = comments.map((c) => ({
      ...c,
      author: c.author || {
        _id: null,
        name: "Unknown",
        username: "",
        avatar: null,
      },
      hasLiked: uid ? c.likes.some((id) => id.toString() === uid) : false,
      likes: c.likes.length,
    }));

    res.json({
      success: true,
      data: {
        comments: mapped,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("Error fetching comments:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post(
  "/posts/:postId",
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

      const post = await Post.findById(postId).select("_id author");
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
        parent = await Comment.findById(parentId).select("_id postId");
        if (!parent || parent.postId.toString() !== postId) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid parent comment" });
        }
      }

      const comment = await Comment.create({
        text: safeText,
        author: userId,
        postId,
        parentId: parent ? parent._id : null,
      });

      if (parent) {
        await Comment.updateOne(
          { _id: parent._id },
          { $addToSet: { replies: comment._id } }
        );
      }

      await comment.populate("author", "name username avatar");

      res.status(201).json({
        success: true,
        data: {
          ...comment.toObject(),
          hasLiked: false,
          likes: 0,
        },
      });
    } catch (e) {
      console.error("Error creating comment:", e);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

router.post("/:commentId/like", protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidId(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const add = await Comment.updateOne(
      { _id: commentId, likes: { $ne: userId } },
      { $addToSet: { likes: userId } }
    );

    let hasLiked;
    if (add.modifiedCount === 1) {
      hasLiked = true;
    } else {
      await Comment.updateOne({ _id: commentId }, { $pull: { likes: userId } });
      hasLiked = false;
    }

    const fresh = await Comment.findById(commentId)
      .populate("author", "name username avatar")
      .lean();

    if (!fresh) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const safeAuthor = fresh.author || {
      _id: null,
      name: "Unknown",
      username: "",
      avatar: null,
    };

    res.json({
      success: true,
      data: {
        ...fresh,
        author: safeAuthor,
        hasLiked,
        likes: (fresh.likes || []).length,
      },
    });
  } catch (e) {
    console.error("Error liking comment:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:commentId", protect, async (req, res) => {
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

    const post = await Post.findById(comment.postId)
      .select("author")
      .session(session);
    const canDelete =
      comment.author.toString() === userId ||
      post?.author?.toString() === userId;

    if (!canDelete) {
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
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (e) {
    await session.abortTransaction();
    console.error("Error deleting comment:", e);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    session.endSession();
  }
});

router.get("/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidId(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const parentExists = await Comment.exists({ _id: commentId });
    if (!parentExists) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const { page, limit } = parsePaging(req, { page: 1, limit: 20, max: 100 });

    const [total, replies] = await Promise.all([
      Comment.countDocuments({ parentId: commentId, isDeleted: false }),
      Comment.find({ parentId: commentId, isDeleted: false })
        .populate("author", "name username avatar")
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const mapped = replies.map((r) => ({
      ...r,
      author: r.author || {
        _id: null,
        name: "Unknown",
        username: "",
        avatar: null,
      },
      hasLiked: uid ? r.likes.some((id) => id.toString() === uid) : false,
      likes: r.likes.length,
    }));

    res.json({
      success: true,
      data: {
        replies: mapped,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("Error fetching replies:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
