// Updated server/models/Subscriber.js
const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
  // Keep basic info
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email address",
    ],
  },
  name: {
    type: String,
    trim: true,
  },
  // OneSignal specific fields
  oneSignalId: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values to not trigger uniqueness
  },
  deviceType: {
    type: String,
    enum: ["web", "ios", "android"],
    default: "web",
  },
  // Notification preferences
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    categories: {
      posts: {
        type: Boolean,
        default: true,
      },
      stories: {
        type: Boolean,
        default: true,
      },
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastNotified: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-update the updatedAt field
SubscriberSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);
