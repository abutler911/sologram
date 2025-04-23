// utils/notificationService.js
import OneSignal from "react-onesignal";
import axios from "axios";

// Initialize OneSignal with your app ID
export const initializeOneSignal = async (userId) => {
  try {
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

    // Set external user ID if we have one
    if (userId) {
      await OneSignal.setExternalUserId(userId);
      console.log("[Notifications] Set external user ID:", userId);
    }

    return true;
  } catch (error) {
    console.error("[Notifications] Error initializing OneSignal:", error);
    return false;
  }
};

// Check if notifications are already enabled
export const isSubscribed = async () => {
  try {
    return await OneSignal.isPushNotificationsEnabled();
  } catch (error) {
    console.error("[Notifications] Error checking subscription status:", error);
    return false;
  }
};

// Register for push notifications
export const subscribeToNotifications = async (userId) => {
  try {
    // Always set the user ID when subscribing
    if (userId) {
      await OneSignal.setExternalUserId(userId);
    }

    // Check if already subscribed
    const alreadySubscribed = await OneSignal.isPushNotificationsEnabled();
    if (alreadySubscribed) {
      console.log("[Notifications] Already subscribed");

      // Still register the player ID with our server
      const playerId = await OneSignal.getUserId();
      if (playerId) {
        await registerPlayerIdWithServer(playerId);
      }

      return true;
    }

    // Request permission and subscribe
    const notificationPermission = await OneSignal.getNotificationPermission();

    if (notificationPermission === "denied") {
      console.warn("[Notifications] Permission denied by user");
      return false;
    }

    // This will show the native browser prompt if needed
    await OneSignal.registerForPushNotifications();

    // Check if subscription was successful
    const subscribed = await OneSignal.isPushNotificationsEnabled();

    if (subscribed) {
      console.log("[Notifications] Successfully subscribed");

      // Get player ID and register with server
      const playerId = await OneSignal.getUserId();
      if (playerId) {
        await registerPlayerIdWithServer(playerId);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("[Notifications] Error subscribing:", error);
    return false;
  }
};

// Register OneSignal player ID with your server
const registerPlayerIdWithServer = async (playerId) => {
  try {
    const token = localStorage.getItem("token");

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
        "[Notifications] Player ID registered with server:",
        playerId
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error(
      "[Notifications] Error registering player ID with server:",
      error
    );
    throw error;
  }
};

// Get current permission status
export const getNotificationPermission = async () => {
  try {
    return await OneSignal.getNotificationPermission();
  } catch (error) {
    console.error("[Notifications] Error getting permission status:", error);
    return "default";
  }
};

// Get OneSignal player ID
export const getPlayerId = async () => {
  try {
    return await OneSignal.getUserId();
  } catch (error) {
    console.error("[Notifications] Error getting player ID:", error);
    return null;
  }
};

// Unsubscribe from notifications
export const unsubscribeFromNotifications = async () => {
  try {
    await OneSignal.setSubscription(false);
    return true;
  } catch (error) {
    console.error("[Notifications] Error unsubscribing:", error);
    return false;
  }
};
