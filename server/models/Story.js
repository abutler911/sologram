const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  media: [
    {
      mediaType: {
        type: String,
        enum: ["image", "video"],
        default: "image",
      },
      mediaUrl: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Expires after 24 hours (in seconds)
  },
});

module.exports = mongoose.model("Story", StorySchema);
