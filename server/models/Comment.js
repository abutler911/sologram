const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
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
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    isDeleted: { type: Boolean, default: false },
    moderationFlags: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ createdAt: -1 });

commentSchema.virtual("likeCount").get(function () {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

commentSchema.virtual("replyCount").get(function () {
  return Array.isArray(this.replies) ? this.replies.length : 0;
});

commentSchema.methods.hasUserLiked = function (userId) {
  const uid = userId?.toString();
  return (
    Array.isArray(this.likes) && this.likes.some((id) => id.toString() === uid)
  );
};

commentSchema.pre("validate", async function (next) {
  if (!this.parentId) return next();
  try {
    const parent = await this.constructor
      .findById(this.parentId)
      .select("postId parentId");
    if (!parent) return next(new Error("Parent comment not found"));
    if (parent.postId.toString() !== this.postId.toString()) {
      return next(new Error("Parent comment belongs to a different post"));
    }
    if (parent.parentId) {
      return next(
        new Error("Nested replies deeper than one level are not allowed")
      );
    }
    next();
  } catch (e) {
    next(e);
  }
});

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
