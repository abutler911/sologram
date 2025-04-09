// client/src/utils/oneSignal.js

import { toast } from "react-hot-toast";

// Track initialization state globally
let isInitialized = false;
let isInitializing = false;
let initPromise = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Initialize OneSignal with better error handling and retry logic
 */
export const initializeOneSignal = async () => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") return false;

    // Check if OneSignal is already initialized or initializing
    if (isInitialized) {
      console.log("[OneSignal] Already initialized successfully");
      return true;
    }

    if (isInitializing && initPromise) {
      console.log("[OneSignal] Initialization already in progress");
      return initPromise;
    }

    // Track initialization state
    isInitializing = true;
    initAttempts++;

    console.log(
      `[OneSignal] Starting initialization (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`
    );

    const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;

    if (!appId) {
      console.error("[OneSignal] Missing APP_ID environment variable");
      isInitializing = false;
      return false;
    }

    // Create the initialization promise
    initPromise = new Promise(async (resolve) => {
      try {
        // Dynamic import to avoid SSR issues and reduce initial bundle size
        const OneSignal = (await import("react-onesignal")).default;

        // Initialize with improved options
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "/OneSignalSDKWorker.js",
          serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
          autoRegister: false,
          autoResubscribe: true,
          notifyButton: {
            enable: false,
          },
          persistNotification: false,
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false,
                  text: {
                    actionMessage:
                      "Get notified when new photos and stories are posted!",
                    acceptButton: "Allow",
                    cancelButton: "Maybe Later",
                  },
                },
              ],
            },
          },
        });

        console.log("[OneSignal] Initialized successfully");

        // Set up a timer to verify OneSignal is actually ready
        const verifyTimeout = setTimeout(() => {
          if (!window.OneSignal) {
            console.warn(
              "[OneSignal] Window.OneSignal not available after init"
            );
            isInitializing = false;
            resolve(false);
          }
        }, 5000);

        // Wait for OneSignal to be ready
        try {
          OneSignal.on("initialized", (isOptedIn) => {
            clearTimeout(verifyTimeout);
            console.log(
              `[OneSignal] Initialization event received, opted in: ${isOptedIn}`
            );

            isInitialized = true;
            isInitializing = false;
            resolve(true);
          });
        } catch (eventError) {
          console.error(
            "[OneSignal] Error setting up event listener:",
            eventError
          );
          clearTimeout(verifyTimeout);
          isInitializing = false;
          resolve(false);
        }
      } catch (error) {
        console.error("[OneSignal] Initialization error:", error);

        // Retry logic
        isInitializing = false;

        if (initAttempts < MAX_INIT_ATTEMPTS) {
          console.log(`[OneSignal] Will retry initialization in 3 seconds`);

          // Wait 3 seconds before retry
          setTimeout(() => {
            initPromise = null; // Clear the promise for next attempt
          }, 3000);

          resolve(false);
        } else {
          console.error(
            `[OneSignal] Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached`
          );
          resolve(false);
        }
      }
    });

    return await initPromise;
  } catch (error) {
    console.error("[OneSignal] Fatal initialization error:", error);
    isInitializing = false;
    initPromise = null;
    return false;
  }
};

/**
 * Helper function to check if OneSignal is ready
 */
export const isOneSignalReady = () => {
  return (
    isInitialized &&
    window.OneSignal &&
    typeof window.OneSignal.isPushNotificationsEnabled === "function"
  );
};

/**
 * Check if the browser supports web push notifications
 * @returns {boolean} - True if supported, false otherwise
 */
export const checkNotificationCompatibility = () => {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
};

/**
 * Get helpful diagnostic information about notification support
 * @returns {Object} - Diagnostic information
 */
export const getNotificationDiagnostics = () => {
  try {
    const isSecureContext = window.isSecureContext;
    const notificationPermission = Notification.permission;
    const serviceWorkerSupported = "serviceWorker" in navigator;
    const pushManagerSupported = "PushManager" in window;

    // Check Service Worker registration
    let hasServiceWorker = false;
    try {
      if (serviceWorkerSupported) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          hasServiceWorker = registrations.length > 0;
        });
      }
    } catch (swError) {
      console.error("Error checking service worker registrations:", swError);
    }

    return {
      isSecureContext,
      notificationPermission,
      serviceWorkerSupported,
      pushManagerSupported,
      hasServiceWorker,
      browser: navigator.userAgent,
    };
  } catch (error) {
    return {
      error: error.message,
      browser: navigator.userAgent,
    };
  }
};

/**
 * Request notification permission with improved UX and error handling
 */
export const requestNotificationPermission = async () => {
  try {
    // Ensure OneSignal is initialized first
    if (!isInitialized) {
      const initialized = await initializeOneSignal();
      if (!initialized) {
        console.warn(
          "[OneSignal] Failed to initialize before requesting permission"
        );
        toast.error(
          "Notification system is temporarily unavailable. Please try again later."
        );
        return false;
      }
    }

    // Check if OneSignal is available
    if (!window.OneSignal) {
      console.warn("[OneSignal] OneSignal not available in window");
      toast.error(
        "Notification system is not ready yet. Please try again in a moment."
      );
      return false;
    }

    try {
      // Check current permission
      const permission = await window.OneSignal.getNotificationPermission();

      // If already denied by browser, show a helpful message
      if (permission === "denied") {
        console.log("[OneSignal] Notifications already denied by browser");
        toast.error(
          "Notifications are blocked by your browser. Please update your browser settings to enable notifications.",
          { duration: 6000 }
        );
        return false;
      }

      // Check if already subscribed
      const alreadyEnabled =
        await window.OneSignal.isPushNotificationsEnabled();
      if (alreadyEnabled) {
        console.log("[OneSignal] User already subscribed to notifications");
        toast.success("You're already subscribed to notifications!");
        return true;
      }
    } catch (permError) {
      console.error("[OneSignal] Error checking permission:", permError);
      // Continue anyway to try the registration
    }

    // Try to show the slidedown prompt first (better UX)
    try {
      if (typeof window.OneSignal.showSlidedownPrompt === "function") {
        console.log("[OneSignal] Showing slidedown prompt");
        await window.OneSignal.showSlidedownPrompt();
      } else if (
        typeof window.OneSignal.registerForPushNotifications === "function"
      ) {
        console.log("[OneSignal] Showing registration prompt");
        await window.OneSignal.registerForPushNotifications();
      } else {
        console.warn(
          "[OneSignal] No method available to prompt for permission"
        );
        return false;
      }

      // Check if permission was granted (after a short delay for user interaction)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      let isEnabled = false;
      try {
        isEnabled = await window.OneSignal.isPushNotificationsEnabled();
      } catch (checkError) {
        console.error(
          "[OneSignal] Error checking if push enabled:",
          checkError
        );
      }

      if (isEnabled) {
        toast.success("Successfully subscribed to notifications!");
      } else {
        // No error, but user probably dismissed the prompt
        toast.info(
          "You can enable notifications anytime from the Subscribe button."
        );
      }

      return isEnabled;
    } catch (error) {
      console.error("[OneSignal] Error requesting permission:", error);
      toast.error(
        "There was a problem enabling notifications. Please try again later."
      );
      return false;
    }
  } catch (error) {
    console.error("[OneSignal] Unexpected error in requestPermission:", error);
    toast.error(
      "Something went wrong with the notification system. Please try again later."
    );
    return false;
  }
};
