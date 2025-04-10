// Updated server/services/notificationService.js
const axios = require("axios");
const Subscriber = require("../models/Subscriber");

// OneSignal configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_API_KEY; // Rename your env var to be explicit
const ONESIGNAL_USER_AUTH_KEY = process.env.ONESIGNAL_USER_AUTH_KEY; // Add this new env var

/**
 * Send a notification using direct HTTP request to OneSignal API
 * This method uses the REST API which is more reliable for server-side sending
 */
const sendNotificationViaREST = async (message, title, url, additionalData) => {
  try {
    console.log("Sending OneSignal notification via REST API:", {
      title,
      message,
      hasUrl: !!url,
      additionalData: Object.keys(additionalData || {}),
    });

    // Build the notification payload according to OneSignal's REST API format
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      included_segments: ["All"],
    };

    // Add URL if provided
    if (url) {
      payload.url = url;
    }

    // Add additional data if provided
    if (additionalData && Object.keys(additionalData).length > 0) {
      payload.data = additionalData;
    }

    // Make the API request
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
      }
    );

    console.log("OneSignal API response:", response.data);
    const recipientCount = response.data.recipients || "unknown number of";
    console.log(
      `Successfully sent notification to ${recipientCount} subscribers`
    );
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
      notificationId: response.data.id,
      recipients: response.data.recipients || 0,
      message: `Notification sent to ${recipientCount} subscribers`,
    };
  } catch (error) {
    console.error("OneSignal notification error:", error.message);

    // Log more details if available
    if (error.response) {
      console.error("Error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }

    return {
      success: false,
      error: error.message,
      code: error.response?.status,
      message: "Failed to send notification",
      details: error.response?.data,
    };
  }
};

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
    // Check if we have the required configuration
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.log("[NOTIFICATION SIMULATED]", { message, title });
      return {
        success: true,
        simulated: true,
        message: "Notification simulated due to missing configuration",
      };
    }

    // Always use the direct REST API method - it's more reliable for server-side
    return sendNotificationViaREST(message, title, url, additionalData);
  } catch (error) {
    console.error("Fatal notification error:", error);
    return {
      success: false,
      error: error.message,
      message: "Fatal error in notification service",
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

  console.log(`Preparing notification for new post: ${post._id}`, {
    title,
    message,
    url,
  });

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

  console.log(`Preparing notification for new story: ${story._id}`, {
    title,
    message,
  });

  return this.sendNotification(message, title, null, {
    type: "story",
    storyId: story._id,
  });
};

/**
 * Send a test notification
 * @param {string} message - Optional custom message
 * @returns {Promise} - Notification result
 */
exports.sendTestNotification = async (
  message = "This is a test notification from SoloGram!"
) => {
  console.log("Sending test notification");

  return this.sendNotification(message, "SoloGram Test", null, {
    type: "test",
    timestamp: Date.now(),
  });
};
