const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Story title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    media: [
      {
        mediaType: {
          type: String,
          enum: {
            values: ["image", "video"],
            message: "Media type must be either image or video",
          },
          default: "image",
        },
        mediaUrl: {
          type: String,
          required: [true, "Media URL is required"],
          // No validation on the URL to ensure Cloudinary URLs work
        },
      },
    ],
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: function () {
        const date = new Date();
        date.setHours(date.getHours() + 24); // Set to expire after 24 hours
        return date;
      },
      index: true,
    },
  },
  {
    timestamps: true,
    // Add this to ensure Mongoose doesn't throw errors on unknown fields
    strict: false,
    // This ensures virtuals are included when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Add compound index for more efficient queries
StorySchema.index({ archived: 1, expiresAt: 1 });

// Pre-save hook to check for expiration
StorySchema.pre("save", function (next) {
  // Check if story should be archived
  if (this.expiresAt && this.expiresAt < new Date() && !this.archived) {
    this.archived = true;
    this.archivedAt = new Date();
  }
  next();
});

// Add virtual property for time left
StorySchema.virtual("timeLeft").get(function () {
  if (this.archived) return 0;

  const now = new Date();
  const expiresAt = this.expiresAt;

  if (!expiresAt || expiresAt <= now) return 0;

  return Math.floor((expiresAt - now) / 1000); // Return seconds left
});

// Method to check if a story is expired
StorySchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Method to archive a story
StorySchema.methods.markAsArchived = function () {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Static method to find expired stories
StorySchema.statics.findExpired = function () {
  return this.find({
    archived: false,
    expiresAt: { $lt: new Date() },
  });
};

module.exports = mongoose.model("Story", StorySchema);
