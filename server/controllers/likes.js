// controllers/likes.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified like controller — one set of endpoints for all content types.
//
// toggle  →  POST /api/likes/toggle   { targetType, targetId }
// count   →  GET  /api/likes/count    ?targetType=post&targetId=xxx
// batch   →  POST /api/likes/check    { targets: [{ type, id }] }
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const Like = require('../models/Like');
const Post = require('../models/Post');
const Thought = require('../models/Thought');

const isValidId = (id) => mongoose.isValidObjectId(id);

// Map of targetType → model (for existence checks)
const MODEL_MAP = {
  post: Post,
  thought: Thought,
  // story: Story,     ← uncomment when Story model gets like support
  // comment: Comment, ← uncomment if you want comment-like toggle here
};

// ─── Toggle (like / unlike) ─────────────────────────────────────────────────

exports.toggle = async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!Like.schema.path('targetType').enumValues.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: `targetType must be one of: ${Like.schema.path('targetType').enumValues.join(', ')}`,
      });
    }
    if (!targetId || !isValidId(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid targetId' });
    }

    // Verify the target actually exists (skip for comment likes — handled separately)
    const Model = MODEL_MAP[targetType];
    if (Model) {
      const exists = await Model.exists({ _id: targetId });
      if (!exists) {
        return res
          .status(404)
          .json({ success: false, message: `${targetType} not found` });
      }
    }

    // Attempt to insert — if duplicate key, it means user already liked → remove
    const filter = { user: userId, targetType, targetId };
    const existing = await Like.findOneAndDelete(filter);

    let liked;
    if (existing) {
      // Was liked → now unliked
      liked = false;
    } else {
      // Not liked → create
      await Like.create(filter);
      liked = true;
    }

    // Get fresh count
    const count = await Like.countDocuments({ targetType, targetId });

    res.json({ success: true, liked, count });
  } catch (err) {
    // Handle race condition: concurrent toggle can still hit duplicate key
    if (err.code === 11000) {
      // Retry as delete
      try {
        await Like.findOneAndDelete({
          user: req.user._id,
          targetType: req.body.targetType,
          targetId: req.body.targetId,
        });
        const count = await Like.countDocuments({
          targetType: req.body.targetType,
          targetId: req.body.targetId,
        });
        return res.json({ success: true, liked: false, count });
      } catch (retryErr) {
        console.error('[likes.toggle] retry failed', retryErr);
      }
    }
    console.error('[likes.toggle]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Count (public) ─────────────────────────────────────────────────────────

exports.count = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;

    if (!targetType || !targetId || !isValidId(targetId)) {
      return res
        .status(400)
        .json({ success: false, message: 'targetType and targetId required' });
    }

    const count = await Like.countDocuments({ targetType, targetId });
    res.json({ success: true, count });
  } catch (err) {
    console.error('[likes.count]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Batch check (auth required) ────────────────────────────────────────────
// Body: { targets: [{ type: 'post', id: '...' }, ...] }
// Returns: { results: [{ type, id, liked }] }

exports.batchCheck = async (req, res) => {
  try {
    const { targets } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(targets) || !targets.length) {
      return res
        .status(400)
        .json({ success: false, message: 'targets array required' });
    }

    // Cap at 100 to prevent abuse
    const capped = targets.slice(0, 100);

    // Build $or query — one round trip
    const conditions = capped
      .filter((t) => t.type && t.id && isValidId(t.id))
      .map((t) => ({ user: userId, targetType: t.type, targetId: t.id }));

    const likes = await Like.find({ $or: conditions })
      .select('targetType targetId')
      .lean();

    // Build a Set for O(1) lookup
    const likedSet = new Set(likes.map((l) => `${l.targetType}:${l.targetId}`));

    const results = capped.map((t) => ({
      type: t.type,
      id: t.id,
      liked: likedSet.has(`${t.type}:${t.id}`),
    }));

    res.json({ success: true, results });
  } catch (err) {
    console.error('[likes.batchCheck]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
