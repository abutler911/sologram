// models/Comment.js
// ─────────────────────────────────────────────────────────────────────────────
// Polymorphic comment model — works across posts, thoughts, and stories.
//
// Migration note: renamed `postId` → `parentId` + added `parentType`.
// ─────────────────────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const COMMENTABLE_TYPES = ['post', 'thought', 'story'];

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // ── Polymorphic parent ─────────────────────────────────────────────────
    parentType: {
      type: String,
      enum: COMMENTABLE_TYPES,
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // ── Reply threading (one level deep) ──────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    // ── Soft delete ───────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    // ── Moderation ────────────────────────────────────────────────────────
    moderationFlags: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────

// List comments for any content type, newest first
commentSchema.index({ parentType: 1, parentId: 1, createdAt: -1 });

// Count endpoint: countDocuments({ parentType, parentId, isDeleted: false })
commentSchema.index({ parentType: 1, parentId: 1, isDeleted: 1 });

// Replies: find({ replyTo }).sort({ createdAt: 1 })
commentSchema.index({ replyTo: 1, createdAt: 1 });

// Author lookup
commentSchema.index({ author: 1 });

// ── Virtuals ────────────────────────────────────────────────────────────────

commentSchema.virtual('replyCount').get(function () {
  return Array.isArray(this.replies) ? this.replies.length : 0;
});

// ── Validation ──────────────────────────────────────────────────────────────

// Replies must be same parent and only one level deep
commentSchema.pre('validate', async function (next) {
  if (!this.replyTo) return next();
  try {
    const parent = await this.constructor
      .findById(this.replyTo)
      .select('parentType parentId replyTo');
    if (!parent) return next(new Error('Parent comment not found'));
    if (
      parent.parentType !== this.parentType ||
      parent.parentId.toString() !== this.parentId.toString()
    ) {
      return next(new Error('Reply must belong to the same content'));
    }
    if (parent.replyTo) {
      return next(
        new Error('Nested replies deeper than one level are not allowed')
      );
    }
    next();
  } catch (e) {
    next(e);
  }
});

// Expose constant for route validation
commentSchema.statics.COMMENTABLE_TYPES = COMMENTABLE_TYPES;

module.exports = mongoose.model('Comment', commentSchema);
