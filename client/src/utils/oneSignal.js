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
      console.warn("[OneSignal] Permission denied in browser");
      return false;
    }

    const alreadySubscribed = await OneSignal.isPushNotificationsEnabled();
    if (alreadySubscribed) {
      console.log("[OneSignal] Already subscribed");
      return true;
    }

    await OneSignal.showSlidedownPrompt();

    const playerId = await OneSignal.getUserId();
    if (!playerId) {
      console.warn("[OneSignal] No Player ID received after prompt");
      return false;
    }
    console.log("[OneSignal] Got Player ID:", playerId);

    if (playerId) {
      const response = await fetch("/api/subscribers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId }),
      });

      if (response.ok) {
        console.log("[OneSignal] Player ID saved to backend");
        return true;
      } else {
        const errorText = await response.text();
        console.warn("[OneSignal] Backend rejected Player ID:", errorText);
      }
    }

    return false;
  } catch (error) {
    console.error("[OneSignal] Error subscribing:", error);
    return false;
  }
};
