// models/Comment.js - MongoDB schema for comments

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
    moderationFlags: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ createdAt: -1 });

// Virtual for like count
commentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual("replyCount").get(function () {
  return this.replies.length;
});

// Method to check if a user has liked this comment
commentSchema.methods.hasUserLiked = function (userId) {
  return this.likes.some((like) => like.toString() === userId.toString());
};

// Static method to get comments with nested replies
commentSchema.statics.getCommentsWithReplies = async function (
  postId,
  options = {}
) {
  const { page = 1, limit = 20, userId } = options;

  // Get top-level comments
  const comments = await this.find({
    postId,
    parentId: null,
    isDeleted: false,
  })
    .populate("author", "name username avatar")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  // Get replies for each comment
  for (let comment of comments) {
    const replies = await this.find({
      parentId: comment._id,
      isDeleted: false,
    })
      .populate("author", "name username avatar")
      .sort({ createdAt: 1 })
      .limit(5) // Limit initial replies, load more on demand
      .lean();

    // Add like status for authenticated users
    if (userId) {
      comment.hasLiked = comment.likes.some(
        (like) => like.toString() === userId
      );
      replies.forEach((reply) => {
        reply.hasLiked = reply.likes.some((like) => like.toString() === userId);
      });
    }

    comment.replies = replies;
    comment.likes = comment.likes.length;
    replies.forEach((reply) => {
      reply.likes = reply.likes.length;
    });
  }

  return comments;
};

// Pre-save middleware to update timestamps
commentSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Post-save middleware to update post comment count
commentSchema.post("save", async function (doc) {
  if (this.isNew && !this.parentId) {
    // Only increment for top-level comments
    await mongoose.model("Post").findByIdAndUpdate(this.postId, {
      $inc: { commentCount: 1 },
    });
  }
});

// Pre-remove middleware to update post comment count
commentSchema.pre("remove", async function (next) {
  try {
    // Count how many comments will be deleted (including replies)
    const replyCount = await this.constructor.countDocuments({
      parentId: this._id,
    });
    const totalDeleted = replyCount + 1;

    // Update post comment count
    await mongoose.model("Post").findByIdAndUpdate(this.postId, {
      $inc: { commentCount: -totalDeleted },
    });

    // Delete all replies
    await this.constructor.deleteMany({ parentId: this._id });

    next();
  } catch (error) {
    next(error);
  }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
