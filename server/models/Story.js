// models/Story.js
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
  archived: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setHours(date.getHours() + 24); // Set to expire after 24 hours
      return date;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add a pre-save hook to check for expiration
StorySchema.pre("save", function (next) {
  if (this.expiresAt && this.expiresAt < new Date() && !this.archived) {
    this.archived = true;
  }
  next();
});

module.exports = mongoose.model("Story", StorySchema);
