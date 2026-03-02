// models/Like.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified like model.  One document per user-target pair.
// Replaces the old { post, user } schema.
//
// Supports: post, thought, story, comment
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const LIKEABLE_TYPES = ['post', 'thought', 'story', 'comment'];

const LikeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: LIKEABLE_TYPES,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

// One like per user per target — enforced at the DB level
LikeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Fast count + existence queries:  countDocuments({ targetType, targetId })
LikeSchema.index({ targetType: 1, targetId: 1 });

// Statics for convenience — keeps controllers thin
LikeSchema.statics.LIKEABLE_TYPES = LIKEABLE_TYPES;

module.exports = mongoose.model('Like', LikeSchema);
