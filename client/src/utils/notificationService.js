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

    // Register for push notifications
    console.log("[Notifications] Requesting permission...");
    await OneSignal.registerForPushNotifications();

    // We don't have a direct way to check if it succeeded, so we'll consider it a success
    // if no error was thrown
    console.log("[Notifications] Subscription requested successfully");

    // Try to get player ID and register with server
    try {
      const playerId = await getPlayerId();
      if (playerId) {
        await registerPlayerIdWithServer(playerId);
      }
    } catch (error) {
      console.error("[Notifications] Error getting player ID:", error);
      // Continue anyway as we might still be subscribed
    }

    return true;
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

    // Use the available method to get player ID
    const playerId = await OneSignal.getUserId();
    console.log("[Notifications] Got player ID:", playerId);
    return playerId;
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
