// models/GeneratedContent.js
const mongoose = require("mongoose");

const GeneratedContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalDescription: {
      type: String,
      required: true,
      maxlength: 500,
    },
    generatedContent: {
      title: {
        type: String,
        required: true,
        maxlength: 100,
      },
      caption: {
        type: String,
        required: true,
        maxlength: 2000,
      },
      tags: [
        {
          type: String,
          maxlength: 50,
        },
      ],
      altText: {
        type: String,
        maxlength: 200,
        default: "",
      },
    },
    contentType: {
      type: String,
      enum: [
        "general",
        "product",
        "behind-scenes",
        "educational",
        "lifestyle",
        "announcement",
      ],
      default: "general",
    },
    tone: {
      type: String,
      enum: [
        "casual",
        "professional",
        "playful",
        "inspirational",
        "minimalist",
      ],
      default: "casual",
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    // Optional: Link to actual post if content was used
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    // Metadata for analytics
    metadata: {
      tokensUsed: {
        type: Number,
        default: 0,
      },
      model: {
        type: String,
        default: "gpt-4",
      },
      generationTime: {
        type: Number, // milliseconds
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
GeneratedContentSchema.index({ userId: 1, createdAt: -1 });
GeneratedContentSchema.index({ userId: 1, contentType: 1 });
GeneratedContentSchema.index({ userId: 1, used: 1 });

// Method to mark content as used
GeneratedContentSchema.methods.markAsUsed = function (postId = null) {
  this.used = true;
  this.usedAt = new Date();
  if (postId) {
    this.postId = postId;
  }
  return this.save();
};

// Static method to get usage statistics
GeneratedContentSchema.statics.getUsageStats = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGenerated: { $sum: 1 },
        totalUsed: { $sum: { $cond: ["$used", 1, 0] } },
        byContentType: {
          $push: {
            type: "$contentType",
            used: "$used",
          },
        },
        byTone: {
          $push: {
            tone: "$tone",
            used: "$used",
          },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("GeneratedContent", GeneratedContentSchema);
