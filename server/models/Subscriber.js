const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    trim: true,
    match: [
      /^\+?[1-9]\d{1,14}$/,
      "Please provide a valid phone number in E.164 format (e.g., +15551234567)",
    ],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationExpires: {
    type: Date,
    select: false,
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
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);
