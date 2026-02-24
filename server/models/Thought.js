// models/Thought.js
const mongoose = require('mongoose');

const ThoughtSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Thought content is required'],
      trim: true,
      maxlength: [800, 'Thoughts cannot exceed 800 characters'],
    },
    media: {
      mediaType: {
        type: String,
        enum: {
          values: ['image', 'none'],
          default: 'none',
        },
      },
      mediaUrl: { type: String },
      cloudinaryId: { type: String },
    },
    mood: {
      type: String,
      enum: [
        'inspired',
        'reflective',
        'excited',
        'creative',
        'calm',
        'curious',
        'nostalgic',
        'amused',
      ],
      default: 'creative',
    },
    likes: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Full-text search
ThoughtSchema.index({ content: 'text', tags: 'text' });

// getThoughts runs two queries: find({ pinned: true/false }).sort({ createdAt: -1 })
// and countDocuments({ pinned: false }).
// This compound index covers all three — leading field narrows the boolean,
// createdAt direction matches the sort so Mongo never does an in-memory sort.
ThoughtSchema.index({ pinned: 1, createdAt: -1 });

module.exports = mongoose.model('Thought', ThoughtSchema);
