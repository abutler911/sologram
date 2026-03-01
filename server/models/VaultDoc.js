// models/VaultDoc.js
const mongoose = require('mongoose');

const VaultDocSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [50000, 'Content cannot exceed 50,000 characters'],
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    category: {
      type: String,
      enum: [
        'op-ed',
        'essay',
        'letter',
        'manifesto',
        'reflection',
        'draft',
        'uncategorized',
      ],
      default: 'op-ed',
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ['draft', 'final'],
      default: 'draft',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate excerpt + word count before save
VaultDocSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    const text = this.content.replace(/<[^>]*>/g, '').trim();
    this.wordCount = text.split(/\s+/).filter(Boolean).length;
    if (!this.excerpt) {
      this.excerpt = text.slice(0, 280).trim() + (text.length > 280 ? '…' : '');
    }
  }
  next();
});

// Listing: newest first
VaultDocSchema.index({ createdAt: -1 });

// Filter by category
VaultDocSchema.index({ category: 1, createdAt: -1 });

// Full-text search
VaultDocSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('VaultDoc', VaultDocSchema);