// routes/comments.js
// Handles STANDALONE comment actions: like, delete, replies
// Mounted at /api in server.js — routes resolve to /api/comments/:id/*
//
// Post-scoped comment routes (GET/POST /api/posts/:id/comments) live in
// routes/posts.js to guarantee they resolve without mount ambiguity.

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

const isValidId = (id) => mongoose.isValidObjectId(id);

const safeAuthor = (a) =>
  a
    ? {
        _id: a._id,
        name:
          [a.firstName, a.lastName].filter(Boolean).join(' ') ||
          a.username ||
          'Unknown',
        username: a.username || '',
        avatar: a.profileImage || null,
      }
    : { _id: null, name: 'Unknown', username: '', avatar: null };

const fmt = (c, uid) => ({
  ...c,
  author: safeAuthor(c.author),
  hasLiked: uid ? (c.likes || []).some((id) => id.toString() === uid) : false,
  likes: Array.isArray(c.likes) ? c.likes.length : 0,
  replyCount: Array.isArray(c.replies) ? c.replies.length : 0,
});

// POST /api/comments/:commentId/like  (toggle)
router.post('/comments/:commentId/like', protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidId(commentId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid comment ID' });

    const added = await Comment.updateOne(
      { _id: commentId, likes: { $ne: userId } },
      { $addToSet: { likes: userId } }
    );

    if (added.modifiedCount === 0) {
      await Comment.updateOne({ _id: commentId }, { $pull: { likes: userId } });
    }

    const fresh = await Comment.findById(commentId)
      .populate('author', 'firstName lastName username profileImage')
      .lean();

    if (!fresh)
      return res
        .status(404)
        .json({ success: false, message: 'Comment not found' });

    res.json({ success: true, comment: fmt(fresh, userId) });
  } catch (e) {
    console.error('[likeComment]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/comments/:commentId
router.delete('/comments/:commentId', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    if (!isValidId(commentId)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId).session(session);
    if (!comment) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: 'Comment not found' });
    }

    const isOwner = comment.author.toString() === userId;
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized' });
    }

    const replyCount = await Comment.countDocuments({
      parentId: commentId,
    }).session(session);

    await Comment.deleteMany({ parentId: commentId }).session(session);
    await Comment.deleteOne({ _id: commentId }).session(session);
    await Post.updateOne(
      { _id: comment.postId },
      { $inc: { commentCount: -(replyCount + 1) } }
    ).session(session);

    if (comment.parentId) {
      await Comment.updateOne(
        { _id: comment.parentId },
        { $pull: { replies: comment._id } }
      ).session(session);
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (e) {
    await session.abortTransaction();
    console.error('[deleteComment]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    session.endSession();
  }
});

// GET /api/comments/:commentId/replies
router.get('/comments/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!isValidId(commentId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid comment ID' });

    const exists = await Comment.exists({ _id: commentId });
    if (!exists)
      return res
        .status(404)
        .json({ success: false, message: 'Comment not found' });

    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || 20, 10))
    );

    const [total, items] = await Promise.all([
      Comment.countDocuments({ parentId: commentId, isDeleted: false }),
      Comment.find({ parentId: commentId, isDeleted: false })
        .populate('author', 'firstName lastName username profileImage')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    res.json({
      success: true,
      replies: items.map((r) => fmt(r, uid)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('[getReplies]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
