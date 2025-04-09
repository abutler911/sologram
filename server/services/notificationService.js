// Enhanced server/services/notificationService.js
const OneSignal = require("@onesignal/node-onesignal");
const Subscriber = require("../models/Subscriber");

// OneSignal configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_USER_KEY = process.env.ONESIGNAL_USER_KEY;

// Initialize OneSignal client
let client = null;

try {
  if (ONESIGNAL_APP_ID && ONESIGNAL_API_KEY && ONESIGNAL_USER_KEY) {
    const configuration = OneSignal.createConfiguration({
      appKey: ONESIGNAL_API_KEY,
      userKey: ONESIGNAL_USER_KEY,
    });
    client = new OneSignal.DefaultApi(configuration);
  } else {
    console.warn(
      "OneSignal credentials missing. Notification service will be simulated."
    );
  }
} catch (error) {
  console.error("Error initializing OneSignal client:", error);
}

/**
 * Send a notification to all subscribers
 * @param {string} message - The notification message
 * @param {string} title - The notification title (optional)
 * @param {string} url - URL to open when clicked (optional)
 * @param {object} additionalData - Additional data to include (optional)
 * @returns {Promise} - Result object with success status and details
 */
exports.sendNotification = async (
  message,
  title = "SoloGram Update",
  url = null,
  additionalData = {}
) => {
  try {
    if (!client) {
      console.log("[NOTIFICATION SIMULATED]", { message, title });
      return {
        success: true,
        simulated: true,
        message: "Notification simulated due to missing configuration",
      };
    }

    // Build notification payload
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.contents = { en: message };
    notification.headings = { en: title };
    notification.included_segments = ["All"];

    // Add URL if provided
    if (url) {
      notification.url = url;
    }

    // Add additional data if provided
    if (Object.keys(additionalData).length > 0) {
      notification.data = additionalData;
    }

    // Send the notification
    const response = await client.createNotification(notification);

    // Track notification in database
    try {
      await Subscriber.updateMany(
        { isActive: true },
        { lastNotified: new Date() }
      );
    } catch (dbError) {
      console.error("Error updating subscribers lastNotified:", dbError);
    }

    return {
      success: true,
      notificationId: response.id,
      recipients: response.recipients,
      message: `Notification sent to ${response.recipients} subscribers`,
    };
  } catch (error) {
    console.error("OneSignal notification error:", error);

    return {
      success: false,
      error: error.message,
      code: error.statusCode,
      message: "Failed to send notification",
    };
  }
};

/**
 * Send a notification specifically for a new post
 * @param {object} post - The post object
 * @returns {Promise} - Notification result
 */
exports.notifyNewPost = async (post) => {
  const title = "New Post on SoloGram";
  const message = `Check out the new post: "${post.caption}"`;
  const url = `${process.env.CLIENT_URL || "https://thesologram.com"}/post/${
    post._id
  }`;

  return this.sendNotification(message, title, url, {
    type: "post",
    postId: post._id,
  });
};

/**
 * Send a notification specifically for a new story
 * @param {object} story - The story object
 * @returns {Promise} - Notification result
 */
exports.notifyNewStory = async (story) => {
  const title = "New Story on SoloGram";
  const message = `A new story has been added: "${story.title}"`;

  return this.sendNotification(message, title, null, {
    type: "story",
    storyId: story._id,
  });
};
