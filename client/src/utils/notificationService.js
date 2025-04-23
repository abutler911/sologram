// src/utils/notificationService.js
import OneSignal from "react-onesignal";

// Track initialization state
let isInitialized = false;

// Initialize OneSignal
export const initializeOneSignal = async (userId) => {
  if (isInitialized) {
    console.log("[Notifications] OneSignal already initialized");
    return true;
  }

  try {
    if (!process.env.REACT_APP_ONESIGNAL_APP_ID) {
      console.error("[Notifications] Missing OneSignal App ID");
      return false;
    }

    // Initialize with minimal options
    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      notifyButton: {
        enable: false,
      },
      allowLocalhostAsSecureOrigin: true,
      promptOptions: {
        slidedown: {
          prompts: [
            {
              type: "push",
              autoPrompt: false,
              text: {
                actionMessage:
                  "Would you like to receive notifications when new content is posted?",
                acceptButton: "Allow",
                cancelButton: "No Thanks",
              },
            },
          ],
        },
      },
    });

    console.log("[Notifications] OneSignal initialized successfully");
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("[Notifications] Error initializing OneSignal:", error);
    return false;
  }
};

// Subscribe to notifications
export const subscribeToNotifications = async () => {
  try {
    console.log("[Notifications] Starting subscription process");

    if (!isInitialized) {
      const initialized = await initializeOneSignal();
      if (!initialized) {
        console.error("[Notifications] Failed to initialize OneSignal");
        return false;
      }
    }

    // Try different methods to request permission
    console.log("[Notifications] Requesting permission...");

    try {
      // Method 1: Try showSlidedownPrompt if available
      if (typeof OneSignal.showSlidedownPrompt === "function") {
        console.log("[Notifications] Using showSlidedownPrompt method");
        await OneSignal.showSlidedownPrompt();
      }
      // Method 2: Try showNativePrompt if available
      else if (typeof OneSignal.showNativePrompt === "function") {
        console.log("[Notifications] Using showNativePrompt method");
        await OneSignal.showNativePrompt();
      }
      // Method 3: Try showHttpPrompt if available
      else if (typeof OneSignal.showHttpPrompt === "function") {
        console.log("[Notifications] Using showHttpPrompt method");
        await OneSignal.showHttpPrompt();
      }
      // Method 4: Generic push.push method as fallback
      else {
        console.log("[Notifications] Using generic push method");
        OneSignal.push(function () {
          OneSignal.showSlidedownPrompt();
        });
      }

      console.log("[Notifications] Permission prompt shown");

      // Wait a moment to see if user granted permission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Try to get player ID and register with server
      try {
        const playerId = await getPlayerId();
        if (playerId) {
          await registerPlayerIdWithServer(playerId);
          return true;
        }
      } catch (error) {
        console.error("[Notifications] Error getting player ID:", error);
      }

      return true; // Consider it a success if we got this far
    } catch (error) {
      console.error("[Notifications] Error showing prompt:", error);
      return false;
    }
  } catch (error) {
    console.error("[Notifications] Error subscribing to notifications:", error);
    return false;
  }
};

// Get OneSignal player ID
export const getPlayerId = async () => {
  try {
    // Wait a moment to ensure OneSignal has time to generate ID
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Try different methods to get player ID
    let playerId = null;

    if (typeof OneSignal.getUserId === "function") {
      playerId = await OneSignal.getUserId();
    } else if (typeof OneSignal.getPlayerId === "function") {
      playerId = await OneSignal.getPlayerId();
    } else {
      // Last resort: Use push() method
      await new Promise((resolve) => {
        OneSignal.push(function () {
          OneSignal.getUserId(function (id) {
            playerId = id;
            resolve();
          });
        });
      });
    }

    if (playerId) {
      console.log("[Notifications] Got player ID:", playerId);
      return playerId;
    } else {
      console.warn("[Notifications] No player ID available");
      return null;
    }
  } catch (error) {
    console.error("[Notifications] Error getting player ID:", error);
    return null;
  }
};

// Register OneSignal player ID with server
const registerPlayerIdWithServer = async (playerId) => {
  if (!playerId) return false;

  try {
    console.log("[Notifications] Registering player ID with server:", playerId);

    const token = localStorage.getItem("token");

    const response = await fetch("/api/subscribers/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ playerId }),
    });

    if (response.ok) {
      console.log("[Notifications] Player ID registered successfully");
      return true;
    } else {
      console.error(
        "[Notifications] Failed to register player ID:",
        response.status
      );
      return false;
    }
  } catch (error) {
    console.error(
      "[Notifications] Error registering player ID with server:",
      error
    );
    return false;
  }
};
