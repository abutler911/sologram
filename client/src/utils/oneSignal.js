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

    // Try a direct browser notification request first
    console.log("[OneSignal] Trying direct browser notification permission");

    // If Notification API is available
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("[OneSignal] Browser permission result:", permission);

      if (permission === "granted") {
        // Permission granted, now try to register with OneSignal
        return new Promise((resolve) => {
          // Set a timeout for OneSignal registration
          const timeoutId = setTimeout(() => {
            console.log(
              "[OneSignal] Registration with OneSignal timed out, but browser permission granted"
            );
            // We consider it a success even if OneSignal times out
            resolve(true);
          }, 5000);

          // Try to register with OneSignal
          OneSignal.push(async () => {
            try {
              // Register without showing UI (we already have permission)
              await OneSignal.registerForPushNotifications({
                modalPrompt: false,
              });

              // Get player ID if possible
              const playerId = await OneSignal.getUserId();
              console.log("[OneSignal] Player ID:", playerId);

              if (playerId) {
                // Register player ID with server
                try {
                  const token = localStorage.getItem("token");

                  const response = await fetch("/api/subscribers/register", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: token ? `Bearer ${token}` : "",
                    },
                    body: JSON.stringify({ playerId }),
                  });

                  const data = await response.json();
                  console.log("[OneSignal] Server registration result:", data);
                } catch (err) {
                  console.error("[OneSignal] Server registration error:", err);
                }
              }

              clearTimeout(timeoutId);
              resolve(true);
            } catch (err) {
              console.error(
                "[OneSignal] Error registering with OneSignal:",
                err
              );
              clearTimeout(timeoutId);
              // Still consider it success since browser permission is granted
              resolve(true);
            }
          });
        });
      } else {
        console.warn("[OneSignal] Browser permission denied");
        return false;
      }
    } else {
      console.warn("[OneSignal] Notification API not supported");
      return false;
    }
  } catch (error) {
    console.error("[OneSignal] Fatal error in subscribeToPush:", error);
    return false;
  }
};

// Add helper function to manually show a notification (useful for testing)
export const showTestNotification = async (title, message) => {
  if (!("Notification" in window)) {
    console.warn("[OneSignal] Notifications not supported in this browser");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn("[OneSignal] Notification permission not granted");
    return false;
  }

  try {
    const notification = new Notification(title || "Test Notification", {
      body: message || "This is a test notification from SoloGram",
      icon: "/logo192.png",
    });

    notification.onclick = function () {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error("[OneSignal] Error showing test notification:", error);
    return false;
  }
};

// Function to help debug OneSignal state
export const debugOneSignal = async () => {
  try {
    console.group("OneSignal Debug Info");

    // 1. Check if OneSignal is loaded
    console.log("OneSignal global object exists:", !!window.OneSignal);

    if (!window.OneSignal) {
      console.error("OneSignal is not loaded or is blocked by browser!");
      console.groupEnd();
      return;
    }

    // Get OneSignal object
    try {
      const OneSignal = await waitForOneSignal();

      // Check initialization
      OneSignal.push(async function () {
        // Check app ID
        const appId = OneSignal.getAppId();
        console.log("App ID:", appId);

        // Check permissions
        const permission = await OneSignal.getNotificationPermission();
        console.log("Notification permission:", permission);

        // Check subscription status
        const isSubscribed = await OneSignal.isPushNotificationsEnabled();
        console.log("Push notifications enabled:", isSubscribed);

        // Get player ID
        const playerId = await OneSignal.getUserId();
        console.log(
          "OneSignal Player ID:",
          playerId || "None (not subscribed)"
        );

        // Service worker info
        if (navigator.serviceWorker) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          console.log("Service worker registrations:", registrations.length);
          registrations.forEach((reg, i) => {
            console.log(`Service Worker ${i + 1}:`, reg.scope);
            console.log(
              "- Script:",
              reg.active?.scriptURL || "No active worker"
            );
            console.log("- State:", reg.active?.state || "N/A");
          });

          // Look for OneSignal worker specifically
          const oneSignalWorker = registrations.find((r) =>
            r.active?.scriptURL?.includes("OneSignal")
          );

          if (oneSignalWorker) {
            console.log(
              "OneSignal service worker found:",
              oneSignalWorker.active?.scriptURL
            );
          } else {
            console.warn("No OneSignal service worker found!");
          }
        }
      });
    } catch (error) {
      console.error("Error accessing OneSignal:", error);
    }

    console.groupEnd();
  } catch (error) {
    console.error("Debug error:", error);
  }
};

export const registerDirectly = async () => {
  try {
    console.log("[OneSignal] Starting direct registration");

    // First, ensure OneSignal is loaded
    if (!window.OneSignal) {
      console.error("[OneSignal] OneSignal not loaded");
      return false;
    }

    // Get app ID
    const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
    if (!appId) {
      console.error("[OneSignal] App ID not found");
      return false;
    }

    // Basic initialization
    window.OneSignal.push(function () {
      window.OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
      });

      // Register without UI
      window.OneSignal.registerForPushNotifications({
        modalPrompt: false,
      })
        .then(function () {
          console.log("[OneSignal] Registration successful");

          // Get player ID
          return window.OneSignal.getUserId();
        })
        .then(function (playerId) {
          console.log("[OneSignal] Player ID:", playerId);

          if (playerId) {
            // Register with server
            const token = localStorage.getItem("token");

            return fetch("/api/subscribers/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify({ playerId }),
            });
          }
        })
        .then(function (response) {
          if (response) {
            return response.json();
          }
        })
        .then(function (data) {
          if (data) {
            console.log("[OneSignal] Server registration result:", data);
          }
          return true;
        })
        .catch(function (error) {
          console.error("[OneSignal] Registration error:", error);
          return false;
        });
    });

    return true;
  } catch (error) {
    console.error("[OneSignal] Fatal error in registerDirectly:", error);
    return false;
  }
};

// Expose to window
if (typeof window !== "undefined") {
  window.debugOneSignal = debugOneSignal;
  window.showTestNotification = showTestNotification;
  window.registerDirectly = registerDirectly;
}

if (typeof window !== "undefined") {
  window.debugOneSignal = debugOneSignal;
  window.showTestNotification = showTestNotification;
}
