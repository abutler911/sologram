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
        resolve(false);
      }, 15000);

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

          console.log("[OneSignal] Checking if already subscribed");
          const subscribed = await OneSignal.isPushNotificationsEnabled();
          console.log("[OneSignal] Already subscribed:", subscribed);

          if (!subscribed) {
            console.log("[OneSignal] Not subscribed, showing prompt");

            // This is the critical part that might be hanging
            try {
              // Use a more reliable method with timeout
              const promptResult = await Promise.race([
                OneSignal.registerForPushNotifications(),
                new Promise((res) =>
                  setTimeout(() => {
                    console.log(
                      "[OneSignal] Prompt display timed out, continuing anyway"
                    );
                    res();
                  }, 5000)
                ),
              ]);

              console.log("[OneSignal] Prompt shown, result:", promptResult);
            } catch (promptError) {
              console.error("[OneSignal] Error showing prompt:", promptError);
              // Continue anyway to check if permission was granted
            }
          }

          // Give time for the browser to process
          await new Promise((r) => setTimeout(r, 1000));

          // Check if permission was granted
          console.log("[OneSignal] Checking final subscription state");
          const finalSubscriptionState =
            await OneSignal.isPushNotificationsEnabled();
          console.log(
            "[OneSignal] Final subscription state:",
            finalSubscriptionState
          );

          if (!finalSubscriptionState) {
            console.warn("[OneSignal] User did not grant permission");
            clearTimeout(timeoutId);
            return resolve(false);
          }

          // Get the player ID and register with your server
          console.log("[OneSignal] Getting player ID");
          const playerId = await OneSignal.getUserId();
          console.log("[OneSignal] Player ID:", playerId);

          if (playerId) {
            try {
              console.log("[OneSignal] Registering player ID with server");
              const token = localStorage.getItem("token");

              const response = await fetch("/api/subscribers/register", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify({ playerId }),
              });

              if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
              }

              console.log("[OneSignal] Player ID registered successfully");
              clearTimeout(timeoutId);
              return resolve(true);
            } catch (error) {
              console.error("[OneSignal] Server registration error:", error);
              clearTimeout(timeoutId);
              return resolve(false);
            }
          } else {
            console.warn("[OneSignal] No player ID available");
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
