// models/Post.js
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, required: true, trim: true },
    content: { type: String, trim: true },
    media: [
      {
        mediaType: {
          type: String,
          enum: ["image", "video", "none"],
          default: "none",
        },
        mediaUrl: { type: String },
        cloudinaryId: { type: String },
        filter: { type: String, default: "" },
      },
    ],
    location: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }],
    eventDate: { type: Date, required: true },
    postedAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: false }
);

PostSchema.index({
  title: "text",
  caption: "text",
  content: "text",
  tags: "text",
});
PostSchema.index({ commentCount: -1 });

module.exports = mongoose.model("Post", PostSchema);
