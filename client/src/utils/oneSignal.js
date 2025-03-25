// src/utils/oneSignal.js
import OneSignal from "react-onesignal";

export const initializeOneSignal = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false;

    // Check if OneSignal is already initialized to prevent duplicate initializations
    if (window.OneSignal && window.OneSignal.initialized) {
      console.log("[OneSignal] Already initialized");
      return true;
    }

    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID || "",
      allowLocalhostAsSecureOrigin: true,

      // Important: Let OneSignal handle its own service worker
      // Don't override with custom paths
      serviceWorkerParam: {
        scope: "/",
      },

      // Disable native notification prompt initially
      autoResubscribe: false,
      autoRegister: false,

      notifyButton: {
        enable: false,
      },

      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: false, // Don't show automatically
              text: {
                actionMessage:
                  "Stay updated with the latest content from SoloGram",
                acceptButton: "Allow",
                cancelButton: "Maybe Later",
              },
            },
          ],
        },
      },
    });

    console.log("[OneSignal] Initialized successfully");

    // Set external user ID if available
    const userId = localStorage.getItem("userId");
    if (userId && typeof OneSignal.setExternalUserId === "function") {
      await OneSignal.setExternalUserId(userId);
    }

    // Debug: Check notification permission status
    const isPushSupported = await OneSignal.isPushNotificationsSupported();
    if (isPushSupported) {
      const isEnabled = await OneSignal.isPushNotificationsEnabled();
      console.log(
        "[OneSignal] Push notifications supported and enabled:",
        isEnabled
      );
      const permission = await OneSignal.getNotificationPermission();
      console.log("[OneSignal] Current permission status:", permission);
    } else {
      console.log(
        "[OneSignal] Push notifications not supported on this browser/device"
      );
    }

    return true;
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
    return false;
  }
};

// For sending notifications from client (if needed)
export const sendNotification = async (title, message, url = null) => {
  try {
    // We'll call our backend API that will use OneSignal REST API
    const response = await fetch("/api/notifications/custom", {
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

// Helper function to check if OneSignal is ready
export const isOneSignalReady = () => {
  return (
    window.OneSignal &&
    typeof window.OneSignal.isPushNotificationsEnabled === "function"
  );
};

// Function to request notification permission
export const requestNotificationPermission = async () => {
  try {
    if (!isOneSignalReady()) {
      console.warn("[OneSignal] Not ready yet");
      return false;
    }

    // Show the OneSignal slidedown prompt
    await OneSignal.showSlidedownPrompt();

    // Check if permission was granted
    const permission = await OneSignal.getNotificationPermission();
    const enabled = await OneSignal.isPushNotificationsEnabled();

    console.log("[OneSignal] Permission after prompt:", permission);
    console.log("[OneSignal] Enabled after prompt:", enabled);

    return enabled;
  } catch (error) {
    console.error("[OneSignal] Error requesting permission:", error);
    return false;
  }
};
