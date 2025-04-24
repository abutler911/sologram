const waitForOneSignal = async () => {
  let attempts = 0;
  const maxAttempts = 50; // 5 seconds max wait time

  return new Promise((resolve, reject) => {
    const check = () => {
      attempts++;

      if (window.OneSignal && window.OneSignal.push) {
        console.log("[OneSignal] SDK found after", attempts, "attempts");
        resolve(window.OneSignal);
      } else if (attempts > maxAttempts) {
        console.error("[OneSignal] SDK not found after 5 seconds");
        reject(new Error("OneSignal SDK not loaded after 5 seconds"));
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
    console.log("[OneSignal] subscribeToPush started");

    // Add timeout to prevent infinite waiting
    const OneSignal = await Promise.race([
      waitForOneSignal(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OneSignal timeout")), 10000)
      ),
    ]);

    console.log("[OneSignal] SDK ready, proceeding with subscription");

    return new Promise((resolve) => {
      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error("[OneSignal] Subscription process timed out");
        // Try directly showing the native browser permission dialog as fallback
        Notification.requestPermission()
          .then((permission) => {
            if (permission === "granted") {
              resolve(true);
            } else {
              resolve(false);
            }
          })
          .catch(() => resolve(false));
      }, 5000);

      OneSignal.push(async () => {
        try {
          console.log("[OneSignal] Checking if push is supported");
          const supported = await OneSignal.isPushNotificationsSupported();
          if (!supported) {
            console.warn("[OneSignal] Push not supported by browser");
            clearTimeout(timeoutId);
            return resolve(false);
          }

          console.log("[OneSignal] Checking current permission");
          const permission = await OneSignal.getNotificationPermission();
          console.log("[OneSignal] Current permission:", permission);

          if (permission === "denied") {
            console.warn("[OneSignal] Permission already denied by user");
            clearTimeout(timeoutId);
            return resolve(false);
          }

          // Try directly with browser API first for more reliability
          const browserPermission = await Notification.requestPermission();
          if (browserPermission === "granted") {
            clearTimeout(timeoutId);
            return resolve(true);
          }

          // If browser permission didn't work, try with OneSignal UI
          try {
            await OneSignal.registerForPushNotifications();

            // Give time for the browser to process
            await new Promise((r) => setTimeout(r, 1000));

            // Check if permission was granted
            const finalSubscriptionState =
              await OneSignal.isPushNotificationsEnabled();

            clearTimeout(timeoutId);
            return resolve(finalSubscriptionState);
          } catch (error) {
            console.error("[OneSignal] Error showing prompt:", error);
            clearTimeout(timeoutId);
            return resolve(false);
          }
        } catch (error) {
          console.error("[OneSignal] Subscription process error:", error);
          clearTimeout(timeoutId);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("[OneSignal] Fatal error in subscribeToPush:", error);
    return false;
  }
};
