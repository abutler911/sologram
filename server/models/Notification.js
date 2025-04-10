// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: "default",
    },
    image: {
      type: String,
      default: null,
    },
    audience: {
      type: String,
      enum: ["all", "segments", "tags"],
      default: "all",
    },
    tags: {
      type: [String],
      default: [],
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "completed",
    },
    sent: {
      type: Number,
      default: 0,
    },
    opened: {
      type: Number,
      default: 0,
    },
    openRate: {
      type: Number,
      default: 0,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
