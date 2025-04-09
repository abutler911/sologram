// New server/controllers/subscribers.js (replacing the old one)
const Subscriber = require("../models/Subscriber");
const notificationService = require("../services/notificationService");

// Register a OneSignal subscriber
exports.registerSubscriber = async (req, res) => {
  try {
    const { oneSignalId, email, name, deviceType } = req.body;

    if (!oneSignalId) {
      return res.status(400).json({
        success: false,
        message: "OneSignal ID is required",
      });
    }

    // Check if subscriber already exists
    let subscriber = await Subscriber.findOne({ oneSignalId });

    if (subscriber) {
      // Update existing subscriber
      subscriber.email = email || subscriber.email;
      subscriber.name = name || subscriber.name;
      subscriber.deviceType = deviceType || subscriber.deviceType;
      subscriber.isActive = true;

      await subscriber.save();

      return res.status(200).json({
        success: true,
        message: "Subscriber updated successfully",
        data: {
          id: subscriber._id,
          oneSignalId: subscriber.oneSignalId,
          email: subscriber.email,
          name: subscriber.name,
        },
      });
    }

    // Create new subscriber
    subscriber = new Subscriber({
      oneSignalId,
      email,
      name,
      deviceType,
    });

    await subscriber.save();

    res.status(201).json({
      success: true,
      message: "Subscriber registered successfully",
      data: {
        id: subscriber._id,
        oneSignalId: subscriber.oneSignalId,
        email: subscriber.email,
        name: subscriber.name,
      },
    });
  } catch (err) {
    console.error("Subscriber registration error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update notification preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { oneSignalId, preferences } = req.body;

    if (!oneSignalId) {
      return res.status(400).json({
        success: false,
        message: "OneSignal ID is required",
      });
    }

    const subscriber = await Subscriber.findOne({ oneSignalId });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    // Update preferences
    if (preferences) {
      subscriber.notificationPreferences = {
        ...subscriber.notificationPreferences,
        ...preferences,
      };
    }

    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        id: subscriber._id,
        preferences: subscriber.notificationPreferences,
      },
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    const { oneSignalId } = req.body;

    if (!oneSignalId) {
      return res.status(400).json({
        success: false,
        message: "OneSignal ID is required",
      });
    }

    const subscriber = await Subscriber.findOne({ oneSignalId });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found",
      });
    }

    // Mark as inactive instead of deleting
    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from notifications",
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Admin only: Get all subscribers
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find()
      .sort({ createdAt: -1 })
      .select(
        "oneSignalId email name deviceType isActive lastNotified createdAt"
      );

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (err) {
    console.error("Get subscribers error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
