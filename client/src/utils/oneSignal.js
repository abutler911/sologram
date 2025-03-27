// src/utils/oneSignal.js
import OneSignal from "react-onesignal";

// Track initialization state globally
let isInitialized = false;
let isInitializing = false;
let initPromise = null;

export const initializeOneSignal = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false;

    // Check if OneSignal is already initialized to prevent duplicate initializations
    if (isInitialized) {
      console.log("[OneSignal] Already initialized");
      return true;
    }

    // If initialization is in progress, return the existing promise
    if (isInitializing && initPromise) {
      return initPromise;
    }

    // Set initializing flag and create promise
    isInitializing = true;
    initPromise = new Promise(async (resolve) => {
      try {
        // Basic initialization with minimal options first
        await OneSignal.init({
          appId: process.env.REACT_APP_ONESIGNAL_APP_ID || "",
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
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

        console.log("[OneSignal] Initialized successfully");

        // Wait for OneSignal to actually be ready using the built-in event
        if (window.OneSignal) {
          // Set external user ID if available
          const userId = localStorage.getItem("userId");
          if (
            userId &&
            typeof window.OneSignal.setExternalUserId === "function"
          ) {
            await window.OneSignal.setExternalUserId(userId);
          }

          isInitialized = true;
          resolve(true);
        } else {
          console.error(
            "[OneSignal] Failed to initialize - window.OneSignal not available"
          );
          resolve(false);
        }
      } catch (error) {
        console.error("[OneSignal] Initialization error:", error);
        resolve(false);
      } finally {
        isInitializing = false;
      }
    });

    return await initPromise;
  } catch (error) {
    console.error("[OneSignal] Fatal initialization error:", error);
    isInitializing = false;
    initPromise = null;
    return false;
  }
};

// Helper function to check if OneSignal is ready
export const isOneSignalReady = () => {
  return (
    isInitialized &&
    window.OneSignal &&
    typeof window.OneSignal.isPushNotificationsEnabled === "function"
  );
};

// Function to request notification permission with safety checks
export const requestNotificationPermission = async () => {
  // Ensure OneSignal is initialized first
  if (!isInitialized) {
    const initialized = await initializeOneSignal();
    if (!initialized) {
      console.warn(
        "[OneSignal] Failed to initialize before requesting permission"
      );
      return false;
    }
  }

  try {
    // Check if OneSignal is available in window object
    if (!window.OneSignal) {
      console.warn("[OneSignal] OneSignal not available in window");
      return false;
    }

    // Check notification permission first to avoid showing prompt if already denied
    const permission = await window.OneSignal.getNotificationPermission();
    if (permission === "denied") {
      console.log("[OneSignal] Notifications already denied by browser");
      return false;
    }

    // Track if permission was already granted
    const alreadyEnabled = await window.OneSignal.isPushNotificationsEnabled();
    if (alreadyEnabled) {
      return true;
    }

    // Check if required methods exist
    if (typeof window.OneSignal.showSlidedownPrompt === "function") {
      await window.OneSignal.showSlidedownPrompt();
    } else if (
      typeof window.OneSignal.registerForPushNotifications === "function"
    ) {
      await window.OneSignal.registerForPushNotifications();
    } else {
      console.warn("[OneSignal] No method available to prompt for permission");
      return false;
    }

    // Wait a moment for user to interact with prompt
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if permission was granted
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
