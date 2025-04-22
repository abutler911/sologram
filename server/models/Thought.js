// models/Thought.js
const mongoose = require("mongoose");

const ThoughtSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Thought content is required"],
      trim: true,
      maxlength: [800, "Thoughts cannot exceed 800 characters"],
    },

    media: {
      mediaType: {
        type: String,
        enum: {
          values: ["image", "none"],
          default: "none",
        },
      },
      mediaUrl: {
        type: String,
      },
      cloudinaryId: {
        type: String,
      },
    },
    mood: {
      type: String,
      enum: [
        "inspired",
        "reflective",
        "excited",
        "creative",
        "calm",
        "curious",
        "nostalgic",
        "amused",
      ],
      default: "creative",
    },
    likes: {
      type: Number,
      default: 0,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add full-text search index
ThoughtSchema.index({ content: "text", tags: "text" });

module.exports = mongoose.model("Thought", ThoughtSchema);
