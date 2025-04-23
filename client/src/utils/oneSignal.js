const waitForOneSignal = async () => {
  return new Promise((resolve) => {
    const check = () => {
      if (window.OneSignal && window.OneSignal.push) {
        resolve(window.OneSignal);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

export const initOneSignal = async (userId) => {
  const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
  if (!appId || !userId) {
    console.warn("[OneSignal] Missing App ID or user ID");
    return false;
  }

  const OneSignal = await waitForOneSignal();

  return new Promise((resolve) => {
    OneSignal.push(() => {
      OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: true,
        autoRegister: false,
        notifyButton: { enable: false },
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
      });

      OneSignal.setExternalUserId(userId.toString());

      console.log("[OneSignal] Initialized and linked to user:", userId);
      resolve(true);
    });
  });
};

export const subscribeToPush = async () => {
  const OneSignal = await waitForOneSignal();

  return new Promise((resolve) => {
    OneSignal.push(async () => {
      try {
        const supported = await OneSignal.isPushNotificationsSupported();
        if (!supported) {
          console.warn("[OneSignal] Push not supported");
          return resolve(false);
        }

        const permission = await OneSignal.getNotificationPermission();
        if (permission === "denied") {
          console.warn("[OneSignal] Permission denied");
          return resolve(false);
        }

        const subscribed = await OneSignal.isPushNotificationsEnabled();
        if (!subscribed) {
          await OneSignal.showSlidedownPrompt();
        }

        const playerId = await OneSignal.getUserId();
        if (playerId) {
          await fetch("/api/subscribers/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId }),
          });

          console.log("[OneSignal] Player ID registered:", playerId);
          return resolve(true);
        }

        resolve(false);
      } catch (error) {
        console.error("[OneSignal] Subscribe error:", error);
        resolve(false);
      }
    });
  });
};
