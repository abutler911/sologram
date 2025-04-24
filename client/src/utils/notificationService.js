// utils/notificationService.js
// Single source of truth for OneSignal integration

// Track initialization state
let isInitializing = false;
let isInitialized = false;

/**
 * Wait for OneSignal SDK to be loaded with timeout
 */
const waitForOneSignal = async (timeoutMs = 5000) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const checkInterval = 100;
    const maxAttempts = timeoutMs / checkInterval;

    const check = () => {
      attempts++;

      if (window.OneSignal && window.OneSignal.push) {
        console.log("[OneSignal] SDK found after", attempts, "attempts");
        resolve(window.OneSignal);
      } else if (attempts > maxAttempts) {
        console.error(`[OneSignal] SDK not found after ${timeoutMs}ms`);
        reject(new Error(`OneSignal SDK not loaded after ${timeoutMs}ms`));
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
};

/**
 * Initialize OneSignal for the current user
 */
export const initializeOneSignal = async (userId) => {
  const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;

  if (!appId || !userId) {
    console.warn("[OneSignal] Missing App ID or user ID");
    return false;
  }

  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    console.log("[OneSignal] Initialization already in progress");
    return false;
  }

  // Skip if already initialized
  if (isInitialized) {
    console.log("[OneSignal] Already initialized");
    return true;
  }

  isInitializing = true;

  try {
    // Wait for OneSignal to be available
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
        isInitialized = true;
        resolve(true);
      });
    });
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
    return false;
  } finally {
    isInitializing = false;
  }
};

/**
 * Subscribe user to push notifications
 * With fallback to browser notifications
 */
export const subscribeToNotifications = async () => {
  try {
    console.log("[OneSignal] Starting subscription process");

    // First try to get direct browser permission
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("[OneSignal] Browser permission result:", permission);

      if (permission !== "granted") {
        console.warn("[OneSignal] Browser permission denied");
        return false;
      }
    } else {
      console.warn("[OneSignal] Notification API not supported");
      return false;
    }

    // Browser permission granted, now try OneSignal registration
    try {
      const OneSignal = await waitForOneSignal(3000);

      // Use a timeout to prevent hanging
      const result = await Promise.race([
        new Promise((resolve) => {
          OneSignal.push(async () => {
            try {
              // Register with OneSignal (quietly, no UI)
              await OneSignal.registerForPushNotifications({
                modalPrompt: false,
              });

              // Get player ID
              const playerId = await OneSignal.getUserId();
              console.log("[OneSignal] Player ID:", playerId);

              if (playerId) {
                // Register with server
                await registerPlayerIdWithServer(playerId);
              }

              resolve(true);
            } catch (error) {
              console.error("[OneSignal] Registration error:", error);
              resolve(false);
            }
          });
        }),
        new Promise((resolve) => {
          setTimeout(() => {
            console.log(
              "[OneSignal] Registration timed out, but browser permission granted"
            );
            resolve(true);
          }, 3000);
        }),
      ]);

      return result;
    } catch (error) {
      console.log(
        "[OneSignal] Error or timeout during OneSignal registration, but browser permission granted"
      );
      // Still considered a success if browser permission is granted
      return true;
    }
  } catch (error) {
    console.error("[OneSignal] Fatal error in subscribeToPush:", error);
    return false;
  }
};

/**
 * Register the player ID with the server
 */
export const registerPlayerIdWithServer = async (playerId) => {
  if (!playerId) {
    console.warn("[OneSignal] No player ID provided");
    return false;
  }

  try {
    console.log("[OneSignal] Registering player ID with server:", playerId);

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

    if (data.success) {
      console.log("[OneSignal] Player ID registered successfully");
      return true;
    } else {
      console.error("[OneSignal] Server registration failed:", data.message);
      return false;
    }
  } catch (error) {
    console.error("[OneSignal] Server registration error:", error);
    return false;
  }
};

/**
 * Get the OneSignal player ID if available
 */
export const getPlayerId = async () => {
  try {
    if (!window.OneSignal) {
      return null;
    }

    return new Promise((resolve) => {
      window.OneSignal.push(function () {
        window.OneSignal.getUserId(function (playerId) {
          resolve(playerId);
        });
      });
    });
  } catch (error) {
    console.error("[OneSignal] Error getting player ID:", error);
    return null;
  }
};

/**
 * Send a test notification using the browser API
 */
export const showTestNotification = (title, message) => {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
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

// Expose debug functions to window for console testing
if (typeof window !== "undefined") {
  window.debugOneSignal = async () => {
    try {
      console.group("OneSignal Debug Info");

      // Check if SDK is loaded
      console.log("SDK loaded:", !!window.OneSignal);

      // Check service workers
      if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log("Service worker registrations:", registrations.length);
        registrations.forEach((reg) => {
          console.log("- Scope:", reg.scope);
          console.log("  Script:", reg.active?.scriptURL);
        });
      }

      // If OneSignal is loaded, check its state
      if (window.OneSignal) {
        window.OneSignal.push(async function () {
          try {
            const playerId = await window.OneSignal.getUserId();
            const isEnabled =
              await window.OneSignal.isPushNotificationsEnabled();
            const permission =
              await window.OneSignal.getNotificationPermission();

            console.log("Player ID:", playerId || "None");
            console.log("Push enabled:", isEnabled);
            console.log("Permission:", permission);
          } catch (error) {
            console.error("Error querying OneSignal:", error);
          }
        });
      }

      console.groupEnd();
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  window.showTestNotification = showTestNotification;
}

export const directRegister = () => {
  // Direct OneSignal registration without any of our abstraction
  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(function () {
    console.log("[DirectRegister] Attempting direct registration");

    // Skip initialization if already done
    if (window.OneSignal.__initAlreadyCalled) {
      console.log(
        "[DirectRegister] OneSignal already initialized, skipping init"
      );
    } else {
      // Initialize if needed
      window.OneSignal.init({
        appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
      });
      console.log("[DirectRegister] OneSignal initialization called");
    }

    // Now register
    window.OneSignal.registerForPushNotifications()
      .then(function () {
        console.log("[DirectRegister] Registration function completed");
        return window.OneSignal.getUserId();
      })
      .then(function (playerId) {
        console.log("[DirectRegister] Got player ID:", playerId);

        // If we have a player ID, register with server
        if (playerId) {
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
        if (response) return response.json();
      })
      .then(function (data) {
        if (data) console.log("[DirectRegister] Server response:", data);

        // Now try to enable
        return window.OneSignal.isPushNotificationsEnabled();
      })
      .then(function (isEnabled) {
        console.log("[DirectRegister] Push enabled status:", isEnabled);
      })
      .catch(function (error) {
        console.error("[DirectRegister] Error during registration:", error);
      });
  });
};

// Expose to window
if (typeof window !== "undefined") {
  window.directRegister = directRegister;
}
