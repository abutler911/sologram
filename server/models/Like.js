// models/Like.js
const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  ip: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure an IP can only like a post once
LikeSchema.index({ post: 1, ip: 1 }, { unique: true });

module.exports = mongoose.model("Like", LikeSchema);
