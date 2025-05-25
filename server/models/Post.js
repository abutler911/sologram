const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
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
    location: {
      type: String,
      trim: true,
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

    // When the event actually happened (e.g. trip date)
    eventDate: {
      type: Date,
      required: true,
    },

    // When the post was first published (never changes)
    postedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // When the post is edited (updated every save)
    updatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Used for feed sorting (duplicate of eventDate)
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: false,
  }
);

// Full-text index
PostSchema.index({
  title: "text",
  caption: "text",
  content: "text",
  tags: "text",
});

PostSchema.index({ commentCount: -1 });

module.exports = mongoose.model("Post", PostSchema);
