const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none',
    },
    mediaUrl: { type: String },
    cloudinaryId: { type: String },
    filter: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, required: true, trim: true },
    content: { type: String, trim: true },
    media: [mediaSchema],
    location: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    eventDate: { type: Date, required: true },
    postedAt: { type: Date, required: true, default: Date.now },
    // FIX: likes was missing — post.likes += 1 produced NaN and was silently dropped
    likes: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Full-text search
PostSchema.index({
  title: 'text',
  caption: 'text',
  content: 'text',
  tags: 'text',
});
// Feed pagination (most common query)
PostSchema.index({ eventDate: -1 });

module.exports = mongoose.model('Post', PostSchema);
