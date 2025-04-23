import OneSignal from "react-onesignal";

export const initOneSignal = async (userId) => {
  const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
  if (!appId) {
    console.warn("[OneSignal] Missing App ID");
    return false;
  }
  if (!userId) {
    console.warn("[OneSignal] Missing user ID");
    return false;
  }

  try {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      autoRegister: false,
      autoResubscribe: true,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
    });

    await OneSignal.setExternalUserId(userId.toString());
    console.log("[OneSignal] Initialized and linked to user:", userId);
    return true;
  } catch (error) {
    console.error("[OneSignal] Initialization failed:", error);
    return false;
  }
};

export const subscribeToPush = async () => {
  try {
    const isSupported = await OneSignal.isPushNotificationsSupported();
    if (!isSupported) {
      console.warn("[OneSignal] Push not supported");
      return false;
    }

    const permission = await OneSignal.getNotificationPermission();
    if (permission === "denied") {
      console.warn("[OneSignal] User has denied notifications");
      return false;
    }

    const isSubscribed = await OneSignal.isPushNotificationsEnabled();
    if (isSubscribed) {
      console.log("[OneSignal] Already subscribed");
      return true;
    }

    // Trigger the slide-down prompt
    await OneSignal.showSlidedownPrompt();
    await OneSignal.registerForPushNotifications();

    // Give some delay before checking
    await new Promise((res) => setTimeout(res, 1500));

    const playerId = await OneSignal.getUserId();
    if (!playerId) {
      console.warn("[OneSignal] Failed to get Player ID after prompt");
      return false;
    }

    // Save to backend
    const response = await fetch("/api/subscribers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });

    if (!response.ok) {
      console.warn("[OneSignal] Failed to save Player ID to backend");
      return false;
    }

    console.log("[OneSignal] Subscribed and saved successfully:", playerId);
    return true;
  } catch (err) {
    console.error("[OneSignal] subscribeToPush error:", err);
    return false;
  }
};
