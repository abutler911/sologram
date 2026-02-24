// models/Story.js
const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Story title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    media: [
      {
        mediaType: {
          type: String,
          enum: {
            values: ['image', 'video'],
            message: 'Media type must be either image or video',
          },
          default: 'image',
        },
        mediaUrl: {
          type: String,
          required: [true, 'Media URL is required'],
        },
        cloudinaryId: { type: String },
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
        date.setHours(date.getHours() + 24);
        return date;
      },
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Live stories — getStories filters { archived: false } and archiveExpired
// uses { archived: false, expiresAt: { $lt: now } }
StorySchema.index({ archived: 1, expiresAt: 1 });

// Archived stories — getArchivedStories filters { archived: true }
// and sorts by archivedAt DESC.
// Separate index needed because expiresAt index above can't serve this sort.
StorySchema.index({ archived: 1, archivedAt: -1 });

// Pre-save: auto-archive if expired
StorySchema.pre('save', function (next) {
  if (this.expiresAt && this.expiresAt < new Date() && !this.archived) {
    this.archived = true;
    this.archivedAt = new Date();
  }
  next();
});

StorySchema.virtual('timeLeft').get(function () {
  if (this.archived) return 0;
  const now = new Date();
  if (!this.expiresAt || this.expiresAt <= now) return 0;
  return Math.floor((this.expiresAt - now) / 1000);
});

StorySchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

StorySchema.methods.markAsArchived = function () {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

StorySchema.statics.findExpired = function () {
  return this.find({ archived: false, expiresAt: { $lt: new Date() } });
};

StorySchema.statics.archiveExpired = async function () {
  const result = await this.updateMany(
    { archived: false, expiresAt: { $lt: new Date() } },
    { $set: { archived: true, archivedAt: new Date() } }
  );
  return result.modifiedCount || 0;
};

module.exports = mongoose.model('Story', StorySchema);
