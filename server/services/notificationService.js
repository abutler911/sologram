const axios = require("axios");

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

exports.sendCustomNotification = async (message, userIds = null) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    };

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
    };

    if (userIds && userIds.length > 0) {
      payload.include_external_user_ids = userIds;
    } else {
      payload.included_segments = ["Subscribed Users"];
    }

    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      { headers }
    );

    return {
      success: true,
      notified: response.data.recipients,
      failed: 0,
      total: response.data.recipients,
    };
  } catch (error) {
    console.error(
      "OneSignal API error:",
      error?.response?.data || error.message
    );
    return {
      success: false,
      message: "Failed to send notification",
      error: error?.response?.data || error.message,
    };
  }
};
