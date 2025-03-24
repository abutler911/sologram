// src/utils/oneSignal.js
import OneSignal from "react-onesignal";

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: {
        scope: "/",
      },
      notifyButton: {
        enable: false,
      },

      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: true,
              text: {
                actionMessage: "Stay updated with SoloGram",
                acceptButton: "Allow",
                cancelButton: "Maybe Later",
              },
            },
          ],
        },
      },
    });

    // OPTIONAL: set external user ID if available
    const userId = localStorage.getItem("userId");
    if (userId && typeof OneSignal.setExternalUserId === "function") {
      await OneSignal.setExternalUserId(userId);
    }

    return true;
  } catch (error) {
    console.error("OneSignal initialization error:", error);
    return false;
  }
};

// For sending notifications
export const sendNotification = async (title, message, url = null) => {
  try {
    // We'll call our backend API that will use OneSignal REST API
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        title,
        message,
        url,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Add OneSignal tag to identify admin users if needed
export const setAdminTag = async (isAdmin) => {
  try {
    if (typeof OneSignal?.sendTag === "function") {
      await OneSignal.sendTag("role", isAdmin ? "admin" : "user");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error setting admin tag:", error);
    return false;
  }
};
