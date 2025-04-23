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

  try {
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
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
    return false;
  }
};

export const subscribeToPush = async () => {
  try {
    const OneSignal = await waitForOneSignal();

    return new Promise(async (resolve) => {
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
            // Use registerForPushNotifications instead of showSlidedownPrompt
            // as it's more reliable across browsers
            await OneSignal.registerForPushNotifications();
          }

          // Give browser time to process permission
          await new Promise((r) => setTimeout(r, 1000));

          const newSubscriptionState =
            await OneSignal.isPushNotificationsEnabled();
          if (!newSubscriptionState) {
            console.warn("[OneSignal] User did not accept permissions");
            return resolve(false);
          }

          const playerId = await OneSignal.getUserId();
          if (playerId) {
            try {
              const response = await fetch("/api/subscribers/register", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ playerId }),
              });

              if (!response.ok) {
                throw new Error("Failed to register playerId with server");
              }

              console.log("[OneSignal] Player ID registered:", playerId);
              return resolve(true);
            } catch (error) {
              console.error("[OneSignal] Server registration error:", error);
              return resolve(false);
            }
          } else {
            console.warn("[OneSignal] No player ID available");
            return resolve(false);
          }
        } catch (error) {
          console.error("[OneSignal] Subscribe error:", error);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("[OneSignal] Fatal error:", error);
    return false;
  }
};
