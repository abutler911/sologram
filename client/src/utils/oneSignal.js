// src/utils/oneSignal.js
import OneSignal from "react-onesignal";

export const initializeOneSignal = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false;

    // Check if OneSignal is already initialized to prevent duplicate initializations
    if (window.OneSignal && window.OneSignal._initialized) {
      console.log("[OneSignal] Already initialized");
      return true;
    }

    // Basic initialization with minimal options first
    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID || "",
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    });

    console.log("[OneSignal] Initialized successfully");

    // Wait for OneSignal to be fully ready before accessing methods
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Now configure additional options if initialization was successful
    if (window.OneSignal) {
      // Set up prompt options after initialization
      if (typeof window.OneSignal.showSlidedownPrompt === "function") {
        window.OneSignal.showSlidedownPrompt({
          force: false,
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false,
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
      }

      // Set external user ID if available
      const userId = localStorage.getItem("userId");
      if (userId && typeof window.OneSignal.setExternalUserId === "function") {
        await window.OneSignal.setExternalUserId(userId);
      }
    }

    return true;
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
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

// Function to request notification permission with safety checks
export const requestNotificationPermission = async () => {
  try {
    // Check if OneSignal is available in window object
    if (!window.OneSignal) {
      console.warn("[OneSignal] OneSignal not available in window");
      return false;
    }

    // Check if required methods exist
    if (typeof window.OneSignal.showSlidedownPrompt !== "function") {
      console.warn("[OneSignal] showSlidedownPrompt function not available");

      // Try alternate method if available
      if (typeof window.OneSignal.registerForPushNotifications === "function") {
        await window.OneSignal.registerForPushNotifications();
      } else {
        return false;
      }
    } else {
      // Show the OneSignal slidedown prompt
      await window.OneSignal.showSlidedownPrompt();
    }

    // Wait a moment for user to interact with prompt
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if permission was granted if method exists
    let enabled = false;

    if (typeof window.OneSignal.isPushNotificationsEnabled === "function") {
      enabled = await window.OneSignal.isPushNotificationsEnabled();
    }

    return enabled;
  } catch (error) {
    console.error("[OneSignal] Error requesting permission:", error);
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
