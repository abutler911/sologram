// models/Memoir.js
const mongoose = require('mongoose');

const MemoirSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    // The month this memoir covers
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    // Stats snapshot for the month
    stats: {
      postCount: { type: Number, default: 0 },
      thoughtCount: { type: Number, default: 0 },
    },
    // Tags extracted from the month's content
    themes: [{ type: String, trim: true }],
    // Generation metadata
    metadata: {
      model: { type: String, default: 'gpt-4o-mini' },
      tokens: { type: Number, default: 0 },
      generatedAt: { type: Date, default: Date.now },
      trigger: {
        type: String,
        enum: ['scheduled', 'manual'],
        default: 'scheduled',
      },
    },
  },
  {
    timestamps: true,
  }
);

// One memoir per month — prevent duplicates
MemoirSchema.index({ year: 1, month: 1 }, { unique: true });

// Listing page sorts newest first
MemoirSchema.index({ year: -1, month: -1 });

module.exports = mongoose.model('Memoir', MemoirSchema);
