// routes/comments.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified comment routes — polymorphic across posts, thoughts, stories.
//
// GET    /api/comments          ?parentType=post&parentId=xxx&page=1
// GET    /api/comments/count    ?parentType=post&parentId=xxx
// POST   /api/comments          { parentType, parentId, text, replyTo? }
// DELETE /api/comments/:id
// GET    /api/comments/:id/replies?page=1
//
// Mounted at /api in server.js → resolves to /api/comments/*
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Thought = require('../models/Thought');
// const Story = require('../models/Story'); // uncomment when ready
const Like = require('../models/Like');
const { clean, safeAuthor } = require('../utils/commentHelpers');

const isValidId = (id) => mongoose.isValidObjectId(id);

// Model map for existence checks
const MODEL_MAP = {
  post: Post,
  thought: Thought,
  // story: Story,
};

const commentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Format helper (enriches with like count) ─────────────────────────────────

async function fmtWithLikes(doc, uid) {
  const likeCount = await Like.countDocuments({
    targetType: 'comment',
    targetId: doc._id,
  });

  let hasLiked = false;
  if (uid) {
    hasLiked = !!(await Like.exists({
      user: uid,
      targetType: 'comment',
      targetId: doc._id,
    }));
  }

  return {
    ...doc,
    author: safeAuthor(doc.author),
    likes: likeCount,
    hasLiked,
    replyCount: Array.isArray(doc.replies) ? doc.replies.length : 0,
  };
}

// Batch version for lists — one aggregation instead of N queries
async function fmtListWithLikes(docs, uid) {
  if (!docs.length) return [];

  const ids = docs.map((d) => d._id);

  // Get all like counts in one aggregation
  const likeCounts = await Like.aggregate([
    { $match: { targetType: 'comment', targetId: { $in: ids } } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    likeCounts.map((r) => [r._id.toString(), r.count])
  );

  // Get user's likes in one query
  let likedSet = new Set();
  if (uid) {
    const userLikes = await Like.find({
      user: uid,
      targetType: 'comment',
      targetId: { $in: ids },
    })
      .select('targetId')
      .lean();
    likedSet = new Set(userLikes.map((l) => l.targetId.toString()));
  }

  return docs.map((doc) => ({
    ...doc,
    author: safeAuthor(doc.author),
    likes: countMap[doc._id.toString()] ?? 0,
    hasLiked: likedSet.has(doc._id.toString()),
    replyCount: Array.isArray(doc.replies) ? doc.replies.length : 0,
  }));
}

// ── GET /api/comments?parentType=post&parentId=xxx ──────────────────────────

router.get('/comments', optionalAuth, async (req, res) => {
  try {
    const { parentType, parentId } = req.query;

    if (
      !Comment.COMMENTABLE_TYPES.includes(parentType) ||
      !isValidId(parentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid parentType and parentId required',
      });
    }

    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || 50, 10))
    );

    const filter = { parentType, parentId, replyTo: null, isDeleted: false };

    const [total, items] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .populate('author', 'firstName lastName username profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const comments = await fmtListWithLikes(items, uid);

    res.json({
      success: true,
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('[getComments]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/comments/count?parentType=post&parentId=xxx ────────────────────

router.get('/comments/count', async (req, res) => {
  try {
    const { parentType, parentId } = req.query;

    if (!parentType || !isValidId(parentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'parentType and parentId required' });
    }

    const count = await Comment.countDocuments({
      parentType,
      parentId,
      isDeleted: false,
    });
    res.json({ success: true, count });
  } catch (e) {
    console.error('[commentCount]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── POST /api/comments ──────────────────────────────────────────────────────

router.post('/comments', protect, commentLimiter, async (req, res) => {
  try {
    const { parentType, parentId, text, replyTo } = req.body;
    const userId = req.user.id;

    // Validate parent
    if (
      !Comment.COMMENTABLE_TYPES.includes(parentType) ||
      !isValidId(parentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid parentType and parentId required',
      });
    }

    // Validate text
    const safeText = clean(text);
    if (!safeText) {
      return res
        .status(400)
        .json({ success: false, message: 'Comment text required' });
    }
    if (safeText.length > 500) {
      return res
        .status(400)
        .json({ success: false, message: 'Comment too long (max 500)' });
    }

    // Verify parent content exists
    const Model = MODEL_MAP[parentType];
    if (Model) {
      const exists = await Model.exists({ _id: parentId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: `${parentType} not found` });
      }
    }

    // Validate reply target
    let parentComment = null;
    if (replyTo) {
      if (!isValidId(replyTo)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid replyTo ID' });
      }
      parentComment = await Comment.findById(replyTo)
        .select('_id parentType parentId replyTo')
        .lean();
      if (!parentComment || parentComment.parentId.toString() !== parentId) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid parent comment' });
      }
      if (parentComment.replyTo) {
        return res
          .status(400)
          .json({ success: false, message: 'Only one-level replies allowed' });
      }
    }

    const comment = await Comment.create({
      text: safeText,
      author: userId,
      parentType,
      parentId,
      replyTo: parentComment ? parentComment._id : null,
    });

    // Update parent's commentCount if applicable
    if (Model && Model.schema.path('commentCount')) {
      await Model.updateOne({ _id: parentId }, { $inc: { commentCount: 1 } });
    }

    // Push reply ref into parent comment
    if (parentComment) {
      await Comment.updateOne(
        { _id: parentComment._id },
        { $push: { replies: comment._id } }
      );
    }

    await comment.populate(
      'author',
      'firstName lastName username profileImage'
    );
    const formatted = await fmtWithLikes(comment.toObject(), userId);

    res.status(201).json({ success: true, comment: formatted });
  } catch (e) {
    console.error('[createComment]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/comments/:id ────────────────────────────────────────────────

router.delete('/comments/:id', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isValidId(id)) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ success: false, message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(id).session(session);
    if (!comment || comment.isDeleted) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ success: false, message: 'Comment not found' });
    }

    // Only author or admin can delete
    if (comment.author.toString() !== userId && !isAdmin) {
      await session.abortTransaction();
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized' });
    }

    // Soft delete
    comment.isDeleted = true;
    await comment.save({ session });

    // Decrement parent's commentCount
    const Model = MODEL_MAP[comment.parentType];
    if (Model && Model.schema.path('commentCount')) {
      await Model.updateOne(
        { _id: comment.parentId },
        { $inc: { commentCount: -1 } },
        { session }
      );
    }

    // Remove from parent comment's replies array
    if (comment.replyTo) {
      await Comment.updateOne(
        { _id: comment.replyTo },
        { $pull: { replies: comment._id } },
        { session }
      );
    }

    // Clean up any likes on this comment
    await Like.deleteMany(
      { targetType: 'comment', targetId: comment._id },
      { session }
    );

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

// ── GET /api/comments/:id/replies ───────────────────────────────────────────

router.get('/comments/:id/replies', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid comment ID' });
    }

    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || 20, 10))
    );

    const [total, items] = await Promise.all([
      Comment.countDocuments({ replyTo: id, isDeleted: false }),
      Comment.find({ replyTo: id, isDeleted: false })
        .populate('author', 'firstName lastName username profileImage')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    const replies = await fmtListWithLikes(items, uid);

    res.json({ success: true, replies, total, page });
  } catch (e) {
    console.error('[getReplies]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
