// models/Post.js
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    media: [
      {
        mediaType: {
          type: String,
          enum: ["image", "video", "none"],
          default: "none",
        },
        mediaUrl: {
          type: String,
        },
        cloudinaryId: {
          type: String,
        },
        filter: { type: String, default: "" },
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    collections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ caption: "text", content: "text", tags: "text" });

module.exports = mongoose.model("Post", PostSchema);
