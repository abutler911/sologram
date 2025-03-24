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

    // Make sure to await the response and store it in a variable
    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notification,
      {
        headers: {
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
      }
    );

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
      included_segments: ["All"], // Send to all subscribers
      url: content.url || "https://sologram.app", // URL to open when notification is clicked
    };

    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      notification,
      {
        headers: {
          "Content-Type": "application/json",
          // Fixed the key name to match the one at the top of the file
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
    // You can implement this to get stats from OneSignal API if needed
    res.status(200).json({
      success: true,
      data: {
        // Sample stats
        totalSubscribers: 0,
        lastSent: null,
      },
    });
  } catch (err) {
    console.error("Get notification stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
