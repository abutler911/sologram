// services/notificationService.js
const Subscriber = require("../models/Subscriber");
const { sendBatchSMS } = require("./smsService");

/**
 * Send notification to all active subscribers when new content is posted
 * @param {Object} content - Content object with title and type
 * @returns {Promise<Object>} - Results of the notification operation
 */
exports.notifySubscribersOfNewContent = async (content) => {
  try {
    // Get all active, verified subscribers
    const subscribers = await Subscriber.find({
      isActive: true,
      isVerified: true,
    });

    if (subscribers.length === 0) {
      return {
        success: true,
        message: "No active subscribers to notify",
        notified: 0,
        total: 0,
      };
    }

    // Create notification message
    const contentType = content.type || "post";
    const message = `SoloGram Update: New ${contentType} "${content.title}" has been added. Check it out now!`;

    // Send notifications
    const results = await sendBatchSMS(subscribers, message);

    // Update lastNotified timestamp for successful sends
    const successfulPhones = results
      .filter((r) => r.success)
      .map((r) => r.phone);

    if (successfulPhones.length > 0) {
      await Subscriber.updateMany(
        { phone: { $in: successfulPhones } },
        { $set: { lastNotified: new Date() } }
      );
    }

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      message: `Notifications sent to ${successful} subscribers`,
      results,
      notified: successful,
      failed,
      total: subscribers.length,
    };
  } catch (error) {
    console.error("Notification error:", error);
    return {
      success: false,
      message: "Failed to send notifications",
      error: error.message,
    };
  }
};

/**
 * Send custom notification to all active subscribers
 * @param {string} message - Custom message to send
 * @returns {Promise<Object>} - Results of the notification operation
 */
exports.sendCustomNotification = async (message) => {
  try {
    // Get all active, verified subscribers
    const subscribers = await Subscriber.find({
      isActive: true,
      isVerified: true,
    });

    if (subscribers.length === 0) {
      return {
        success: true,
        message: "No active subscribers to notify",
        notified: 0,
        total: 0,
      };
    }

    // Prepend SoloGram to the message if not already included
    const formattedMessage = message.includes("SoloGram")
      ? message
      : `SoloGram: ${message}`;

    // Send notifications
    const results = await sendBatchSMS(subscribers, formattedMessage);

    // Update lastNotified timestamp for successful sends
    const successfulPhones = results
      .filter((r) => r.success)
      .map((r) => r.phone);

    if (successfulPhones.length > 0) {
      await Subscriber.updateMany(
        { phone: { $in: successfulPhones } },
        { $set: { lastNotified: new Date() } }
      );
    }

    // Count successes and failures
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      message: `Custom notification sent to ${successful} subscribers`,
      results,
      notified: successful,
      failed,
      total: subscribers.length,
    };
  } catch (error) {
    console.error("Custom notification error:", error);
    return {
      success: false,
      message: "Failed to send custom notification",
      error: error.message,
    };
  }
};
