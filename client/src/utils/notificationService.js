// src/utils/notificationService.js
import OneSignal from "react-onesignal";
import axios from "axios";

// Check if OneSignal is already initialized
let isInitialized = false;

// Initialize OneSignal with your app ID
export const initializeOneSignal = async (userId) => {
  try {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log("[Notifications] OneSignal already initialized");
      return true;
    }

    if (!process.env.REACT_APP_ONESIGNAL_APP_ID) {
      console.error("[Notifications] Missing OneSignal App ID");
      return false;
    }

    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
      serviceWorkerParam: {
        scope: "/",
      },
    });

    console.log("[Notifications] OneSignal initialized successfully");

    // Use a custom tag for user ID instead of setExternalUserId
    if (userId) {
      try {
        // Set a tag with the user ID
        await OneSignal.sendTag("userId", userId.toString());
        console.log("[Notifications] Set user ID tag:", userId);
      } catch (tagError) {
        console.error("[Notifications] Error setting user ID tag:", tagError);
      }
    }

    isInitialized = true;
    return true;
  } catch (error) {
    console.error("[Notifications] Error initializing OneSignal:", error);
    return false;
  }
};

// Check if notifications are already enabled
export const isSubscribed = async () => {
  try {
    // Make sure OneSignal is initialized
    if (!isInitialized) {
      await initializeOneSignal();
    }

    const state = await OneSignal.getNotificationPermission();
    return state === "granted";
  } catch (error) {
    console.error("[Notifications] Error checking subscription status:", error);
    return false;
  }
};

// Get current OneSignal permission state
export const getNotificationPermission = async () => {
  try {
    // Make sure OneSignal is initialized
    if (!isInitialized) {
      await initializeOneSignal();
    }

    return await OneSignal.getNotificationPermission();
  } catch (error) {
    console.error("[Notifications] Error getting permission:", error);
    return "default";
  }
};

// Register for push notifications
export const subscribeToNotifications = async (userId) => {
  try {
    console.log("[Notifications] Starting subscription process");

    // Make sure OneSignal is initialized
    if (!isInitialized) {
      const initialized = await initializeOneSignal(userId);
      if (!initialized) {
        console.error("[Notifications] Failed to initialize OneSignal");
        return false;
      }
    }

    // Set user ID tag if provided
    if (userId) {
      try {
        await OneSignal.sendTag("userId", userId.toString());
      } catch (tagError) {
        console.error("[Notifications] Error setting user ID tag:", tagError);
      }
    }

    // Check current permission status
    const permission = await OneSignal.getNotificationPermission();
    console.log("[Notifications] Current permission status:", permission);

    if (permission === "denied") {
      console.warn("[Notifications] Permission already denied");
      return false;
    }

    // Register for push notifications
    console.log("[Notifications] Requesting permission...");
    await OneSignal.registerForPushNotifications();

    // Check if permission was granted
    const newPermission = await OneSignal.getNotificationPermission();
    console.log("[Notifications] New permission status:", newPermission);

    if (newPermission === "granted") {
      // Get the player ID (different methods depending on OneSignal version)
      let playerId;
      try {
        // Try getUserId method first
        playerId = await OneSignal.getUserId();
      } catch (error) {
        // If getUserId doesn't exist, try getPlayerId
        try {
          playerId = await OneSignal.getPlayerId();
        } catch (error2) {
          console.error("[Notifications] Could not get player ID:", error2);
        }
      }

      if (playerId) {
        // Register player ID with the server
        await registerPlayerIdWithServer(playerId);
        console.log(
          "[Notifications] Successfully subscribed with player ID:",
          playerId
        );
        return true;
      }
    }

    console.warn("[Notifications] Subscription failed or was denied");
    return false;
  } catch (error) {
    console.error("[Notifications] Error subscribing to notifications:", error);
    return false;
  }
};

// Register OneSignal player ID with your server
const registerPlayerIdWithServer = async (playerId) => {
  try {
    console.log("[Notifications] Registering player ID with server:", playerId);

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("[Notifications] No auth token found for API request");
    }

    const response = await axios.post(
      "/api/subscribers/register",
      { playerId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    if (response.status === 200) {
      console.log(
        "[Notifications] Player ID registered successfully with server"
      );
      return true;
    }

    console.warn(
      "[Notifications] Server returned non-200 status:",
      response.status
    );
    return false;
  } catch (error) {
    console.error(
      "[Notifications] Error registering player ID with server:",
      error
    );
    return false;
  }
};
