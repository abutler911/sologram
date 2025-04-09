// server/services/notificationService.js (enhanced version)
const axios = require("axios");
const logger = require("winston"); // Import winston for better logging

// Get OneSignal credentials from environment variables
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

// Validate credentials at startup
if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
  console.warn(
    "OneSignal credentials missing. Notification service will be simulated."
  );
}

// Base headers for all OneSignal API requests
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Basic ${ONESIGNAL_API_KEY}`,
});

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
    if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
      console.log("[NOTIFICATION SIMULATED]", { message, title });
      return {
        success: true,
        simulated: true,
        message: "Notification simulated due to missing credentials",
      };
    }

    console.log("Sending notification:", { message, title });

    // Build notification payload
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: title },
      included_segments: ["All"], // Send to all subscribers
      content_available: true, // Deliver even if app is in background
      priority: 10, // High priority
    };

    // Add URL if provided
    if (url) {
      payload.url = url;
    }

    // Add additional data if provided
    if (Object.keys(additionalData).length > 0) {
      payload.data = additionalData;
    }

    // Send the notification
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      { headers: getHeaders() }
    );

    console.log("OneSignal notification sent successfully:", {
      id: response.data.id,
      recipients: response.data.recipients,
    });

    return {
      success: true,
      notificationId: response.data.id,
      recipients: response.data.recipients,
      message: `Notification sent to ${response.data.recipients} subscribers`,
    };
  } catch (error) {
    console.error(
      "OneSignal notification error:",
      error.response?.data || error.message
    );

    // Enhanced error reporting
    return {
      success: false,
      error: error.response?.data || error.message,
      code: error.response?.status,
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
