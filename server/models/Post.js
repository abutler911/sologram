const mongoose = require('mongoose');

const MAX_MEDIA_PER_POST = 30;

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
    media: {
      type: [mediaSchema],
      validate: {
        validator: (arr) => arr.length <= MAX_MEDIA_PER_POST,
        message: `A post can have at most ${MAX_MEDIA_PER_POST} media items`,
      },
    },
    location: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    eventDate: { type: Date, required: true },
    postedAt: { type: Date, required: true, default: Date.now },
    likes: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({
  title: 'text',
  caption: 'text',
  content: 'text',
  tags: 'text',
});

PostSchema.index({ eventDate: -1 });

module.exports = mongoose.model('Post', PostSchema);
