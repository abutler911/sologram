const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  media: [
    {
      mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
      mediaUrl: {
        type: String,
        required: true,
      },
      s3Key: {
        type: String,
        required: true,
      },
    },
  ],
  viewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

module.exports = mongoose.model("Story", StorySchema);
