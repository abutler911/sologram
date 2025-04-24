// utils/notificationService.js

// Track initialization state
let isInitializing = false;
let isInitialized = false;

/**
 * Wait for OneSignal SDK to be loaded
 * @returns {Promise<void>}
 */
const waitForOneSignalSDK = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkForOneSignal = () => {
      attempts++;

      if (window.OneSignal) {
        console.log("[OneSignal] SDK found after", attempts, "attempts");
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error("OneSignal SDK not loaded after 5 seconds"));
      } else {
        setTimeout(checkForOneSignal, 100);
      }
    };

    checkForOneSignal();
  });
};

/**
 * Initialize OneSignal with the current user
 * @param {string} userId - The user ID to associate with this device
 * @returns {Promise<boolean>} - Whether initialization was successful
 */
export const initializeOneSignal = async (userId) => {
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
    // Check for required app ID
    const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;
    if (!appId) {
      console.error("[OneSignal] Missing App ID in environment variables");
      return false;
    }

    // Wait for OneSignal to be available
    await waitForOneSignalSDK();

    // Initialize OneSignal
    window.OneSignal = window.OneSignal || [];
    window.OneSignal.push(function () {
      window.OneSignal.init({
        appId: appId,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
        // Ensure service worker path is correct
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        // Use slidedown prompt for better UX
        promptOptions: {
          slidedown: {
            prompts: [
              {
                type: "push",
                autoPrompt: false,
                text: {
                  actionMessage:
                    "Would you like to receive notifications when new content is posted?",
                  acceptButton: "Allow",
                  cancelButton: "No Thanks",
                },
              },
            ],
          },
        },
      });

      // Set external user ID if provided
      if (userId) {
        window.OneSignal.setExternalUserId(userId.toString());
        console.log("[OneSignal] Set external user ID:", userId);
      }
    });

    isInitialized = true;
    console.log("[OneSignal] Initialized successfully");
    return true;
  } catch (error) {
    console.error("[OneSignal] Initialization error:", error);
    return false;
  } finally {
    isInitializing = false;
  }
};

/**
 * Show notification permission prompt and subscribe user
 * @returns {Promise<boolean>} Whether subscription was successful
 */
export const subscribeToNotifications = async () => {
  try {
    console.log("[OneSignal] Starting subscription process");

    // Make sure OneSignal is initialized first
    if (!isInitialized) {
      const initialized = await initializeOneSignal();
      if (!initialized) {
        console.error("[OneSignal] Failed to initialize");
        return false;
      }
    }

    // Using a timeout promise to prevent hanging if OneSignal has issues
    return await Promise.race([
      new Promise((resolve) => {
        window.OneSignal.push(async function () {
          try {
            // Check if push is supported on this browser
            const isPushSupported =
              await window.OneSignal.isPushNotificationsSupported();
            if (!isPushSupported) {
              console.warn(
                "[OneSignal] Push notifications not supported on this browser"
              );
              return resolve(false);
            }

            // Check current permission state
            const permission =
              await window.OneSignal.getNotificationPermission();
            console.log("[OneSignal] Current permission:", permission);

            if (permission === "denied") {
              console.warn("[OneSignal] Notifications already denied by user");
              return resolve(false);
            }

            // Check if already subscribed
            const isSubscribed =
              await window.OneSignal.isPushNotificationsEnabled();
            console.log("[OneSignal] Already subscribed:", isSubscribed);

            if (!isSubscribed) {
              // Show the slidedown prompt
              console.log("[OneSignal] Showing subscription prompt");
              await window.OneSignal.showSlidedownPrompt();

              // Wait a moment for user to interact with prompt
              await new Promise((r) => setTimeout(r, 2000));

              // Check if user accepted
              const finalSubscriptionState =
                await window.OneSignal.isPushNotificationsEnabled();
              console.log(
                "[OneSignal] Final subscription state:",
                finalSubscriptionState
              );

              if (!finalSubscriptionState) {
                console.warn("[OneSignal] User did not accept notifications");
                return resolve(false);
              }
            }

            // Get player ID and register with server
            const playerId = await getPlayerId();
            console.log("[OneSignal] Player ID:", playerId);

            if (playerId) {
              const registered = await registerPlayerIdWithServer(playerId);
              return resolve(registered);
            }

            resolve(false);
          } catch (error) {
            console.error("[OneSignal] Subscription error:", error);
            resolve(false);
          }
        });
      }),
      // 5 second timeout to prevent hanging
      new Promise((resolve) => {
        setTimeout(() => {
          console.warn("[OneSignal] Subscription process timed out");
          resolve(false);
        }, 5000);
      }),
    ]);
  } catch (error) {
    console.error("[OneSignal] Fatal error in subscribeToPush:", error);
    return false;
  }
};

/**
 * Get current OneSignal player ID if available
 * @returns {Promise<string|null>} The player ID or null if not available
 */
export const getPlayerId = async () => {
  try {
    if (!window.OneSignal) {
      return null;
    }

    // Wait for init if needed
    if (!isInitialized) {
      await initializeOneSignal();
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
 * Register OneSignal player ID with server
 * @param {string} playerId - The OneSignal player ID
 * @returns {Promise<boolean>} Whether registration was successful
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
