const axios = require("axios");
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

exports.sendCustomNotification = async (message, userIds = null) => {
  console.log("sendCustomNotification called with:", { message, userIds });
  console.log("OneSignal configuration:", {
    appId: ONESIGNAL_APP_ID ? "Defined" : "UNDEFINED",
    apiKey: ONESIGNAL_API_KEY ? "Defined" : "UNDEFINED",
  });

  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${ONESIGNAL_API_KEY}`,
    };

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      contents: { en: message },
      headings: { en: "SoloGram Update" },
    };

    if (userIds && userIds.length > 0) {
      payload.include_external_user_ids = userIds;
      console.log("Sending to specific users:", userIds);
    } else {
      // Try "All" segment instead of "Subscribed Users"
      payload.included_segments = ["All"];
      console.log("Sending to segment: All");
    }

    console.log(
      "Sending notification payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await axios.post(
      "https://onesignal.com/api/v1/notifications",
      payload,
      { headers }
    );

    console.log("OneSignal API response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });

    return {
      success: true,
      notified: response.data.recipients,
      failed: 0,
      total: response.data.recipients,
    };
  } catch (error) {
    console.error("OneSignal API error details:");
    console.error("- Status:", error.response?.status);
    console.error("- Status Text:", error.response?.statusText);
    console.error("- Response Data:", error.response?.data);
    console.error("- Error Message:", error.message);

    return {
      success: false,
      message: "Failed to send notification",
      error: error?.response?.data || error.message,
    };
  }
};
