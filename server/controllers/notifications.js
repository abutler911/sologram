// server/controllers/notifications.js
const axios = require("axios");
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

// Send custom notification using OneSignal API
exports.sendCustomNotification = async (req, res) => {
  try {
    const { message, title } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    // Call OneSignal API
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: title || "SoloGram Update" },
      included_segments: ["All"], // Send to all subscribers
    };

    // Make the API call
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notification,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );

    // Update last sent time in your local database (optional)
    // For example, you might have a Settings model that tracks this

    return res.status(200).json({
      success: true,
      message: `Notification sent successfully to subscribers`,
      notified: response.data.recipients || 0,
      data: response.data,
    });
  } catch (err) {
    console.error("Send notification error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.response?.data || err.message,
    });
  }
};

// Send notification when new content is posted
exports.notifySubscribersOfNewContent = async (content) => {
  try {
    const notification = {
      app_id: ONESIGNAL_APP_ID,
      contents: {
        en: `New ${content.type || "post"} "${
          content.title
        }" has been added. Check it out now!`,
      },
      headings: { en: "SoloGram Update" },
      included_segments: ["All"],
      url: content.url || "https://sologram.app",
    };

    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notification,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );

    return {
      success: true,
      message: `Notification sent to ${response.data.recipients} subscribers`,
      notified: response.data.recipients || 0,
    };
  } catch (error) {
    console.error("OneSignal notification error:", error);
    return {
      success: false,
      message: "Failed to send notification",
      error: error.response?.data || error.message,
    };
  }
};

// Get notification stats (admin only)
exports.getNotificationStats = async (req, res) => {
  try {
    // Fetch OneSignal app details
    const appResponse = await axios.get(
      `https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}`,
      {
        headers: {
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );

    // Find the most recent notification
    const notificationsResponse = await axios.get(
      `https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&limit=1`,
      {
        headers: {
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );

    const lastNotification =
      notificationsResponse.data.notifications &&
      notificationsResponse.data.notifications.length > 0
        ? notificationsResponse.data.notifications[0]
        : null;

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers: appResponse.data.players || 0,
        lastSent: lastNotification ? lastNotification.completed_at : null,
        // You could include additional stats here
      },
    });
  } catch (err) {
    console.error("Get notification stats error:", err);
    res.status(500).json({
      success: false,
      message: "OneSignal API Error",
      error: err.response?.data || err.message,
    });
  }
};
