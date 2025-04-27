// models/Like.js
const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ip: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the compound index to include ip as well
LikeSchema.index({ post: 1, user: 1 }, { unique: true });
LikeSchema.index({ post: 1, ip: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Like", LikeSchema);
