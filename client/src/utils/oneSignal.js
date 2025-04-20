import { toast } from "react-hot-toast";

let isInitialized = false;
let isInitializing = false;
let initPromise = null;
let initAttempts = 0;
let OneSignalSDK = null;
const MAX_INIT_ATTEMPTS = 3;

export const initializeOneSignal = async () => {
  if (typeof window === "undefined") return false;

  if (isInitialized) {
    console.log("[OneSignal] Already initialized successfully");
    return true;
  }

  if (isInitializing && initPromise) {
    console.log("[OneSignal] Initialization already in progress");
    return initPromise;
  }

  isInitializing = true;
  initAttempts++;

  console.log(
    `[OneSignal] Starting initialization (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})`
  );

  const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;

  if (!appId) {
    console.error("[OneSignal] Missing APP_ID environment variable");
    toast.error("Notification system is not configured properly.");
    isInitializing = false;
    return false;
  }

  const maskedAppId =
    appId.substring(0, 4) + "..." + appId.substring(appId.length - 4);
  console.log(`[OneSignal] Using App ID: ${maskedAppId}`);

  initPromise = new Promise(async (resolve) => {
    try {
      const OneSignal = (await import("react-onesignal")).default;
      OneSignalSDK = OneSignal;

      console.log("[OneSignal] SDK loaded successfully");

      const initConfig = {
        appId,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
        autoRegister: false,
        autoResubscribe: true,
        notifyButton: { enable: false },
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
      };

      console.log("[OneSignal] Starting initialization with config:", {
        ...initConfig,
        appId: maskedAppId,
      });

      await OneSignal.init(initConfig);

      console.log("[OneSignal] Initialized successfully");

      const isSecure = window.isSecureContext;
      console.log("[OneSignal] Is secure context:", isSecure);

      if (
        OneSignal &&
        typeof OneSignal.isPushNotificationsSupported === "function"
      ) {
        const isSupported = await OneSignal.isPushNotificationsSupported();
        console.log("[OneSignal] Push supported:", isSupported);

        const permission = await OneSignal.getNotificationPermission();
        console.log("[OneSignal] Current permission status:", permission);

        const isEnabled = await OneSignal.isPushNotificationsEnabled();
        console.log("[OneSignal] Already subscribed:", isEnabled);
      } else {
        console.warn("[OneSignal] isPushNotificationsSupported not available");
      }

      if (window.OneSignal) {
        console.log("[OneSignal] Global OneSignal object is available");
      } else {
        console.warn("[OneSignal] Global OneSignal object is NOT available");
      }

      isInitialized = true;
      isInitializing = false;
      resolve(true);

      setTimeout(() => {
        if (!window.OneSignal) {
          console.warn("[OneSignal] Window.OneSignal not available after init");
          isInitializing = false;
          resolve(false);
        }
      }, 5000);
    } catch (error) {
      console.error("[OneSignal] Initialization error:", error);
      isInitializing = false;

      if (error.message && error.message.includes("service worker")) {
        console.error(
          "[OneSignal] Service worker registration issue detected. Check that your OneSignalSDKWorker.js file exists at the root of your domain"
        );
      }

      if (error.message && error.message.includes("https")) {
        console.error(
          "[OneSignal] Secure context issue detected. OneSignal requires HTTPS or localhost"
        );
      }

      if (initAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`[OneSignal] Will retry initialization in 3 seconds`);
        setTimeout(() => {
          initPromise = null;
          initializeOneSignal(); // Retry initialization
        }, 3000);
      } else {
        console.error(
          `[OneSignal] Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached`
        );
      }

      resolve(false);
    }
  });

  return await initPromise;
};

export const isOneSignalReady = () => {
  return (
    isInitialized &&
    OneSignalSDK &&
    typeof OneSignalSDK.isPushNotificationsEnabled === "function"
  );
};

export const checkNotificationCompatibility = () => {
  const isCompatible =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  console.log("[OneSignal] Browser compatibility check:", {
    serviceWorker: "serviceWorker" in navigator,
    pushManager: "PushManager" in window,
    notification: "Notification" in window,
    isCompatible,
  });

  return isCompatible;
};

export const getNotificationDiagnostics = () => {
  try {
    const isSecureContext = window.isSecureContext;
    const notificationPermission = Notification.permission;
    const serviceWorkerSupported = "serviceWorker" in navigator;
    const pushManagerSupported = "PushManager" in window;

    let hasServiceWorker = false;
    if (serviceWorkerSupported) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        hasServiceWorker = regs.length > 0;
        console.log("[OneSignal] Service worker registrations:", regs.length);

        regs.forEach((reg, index) => {
          console.log(`[OneSignal] Service worker #${index + 1}:`, {
            scope: reg.scope,
            updateViaCache: reg.updateViaCache,
            active: !!reg.active,
          });
        });
      });
    }

    const diagnostics = {
      isSecureContext,
      notificationPermission,
      serviceWorkerSupported,
      pushManagerSupported,
      hasServiceWorker,
      browser: navigator.userAgent,
    };

    console.log("[OneSignal] Full diagnostics:", diagnostics);

    return diagnostics;
  } catch (error) {
    console.error("[OneSignal] Error getting diagnostics:", error);
    return {
      error: error.message,
      browser: navigator.userAgent,
    };
  }
};

export const requestNotificationPermission = async () => {
  try {
    console.log("[OneSignal] Starting notification permission request");

    if (!isInitialized) {
      console.log("[OneSignal] Not initialized yet, will initialize first");
      const initialized = await initializeOneSignal();
      if (!initialized) {
        console.error(
          "[OneSignal] Failed to initialize for permission request"
        );
        toast.error("Notification system not ready.");
        return false;
      }
    }

    if (!OneSignalSDK) {
      console.error("[OneSignal] SDK not available for permission request");
      toast.error("Notification system unavailable.");
      return false;
    }

    const permission = await OneSignalSDK.getNotificationPermission();
    console.log("[OneSignal] Current permission:", permission);

    if (permission === "denied") {
      console.warn("[OneSignal] Notifications are blocked in browser settings");
      toast.error("Notifications are blocked in your browser settings.", {
        duration: 6000,
      });
      return false;
    }

    const alreadyEnabled = await OneSignalSDK.isPushNotificationsEnabled();
    console.log("[OneSignal] Already enabled:", alreadyEnabled);

    if (alreadyEnabled) {
      console.log("[OneSignal] User already subscribed");
      toast.success("You're already subscribed to notifications!");
      return true;
    }

    console.log("[OneSignal] Showing permission prompt");

    if (typeof OneSignalSDK.showSlidedownPrompt === "function") {
      console.log("[OneSignal] Using showSlidedownPrompt method");
      await OneSignalSDK.showSlidedownPrompt();
    } else if (
      typeof OneSignalSDK.registerForPushNotifications === "function"
    ) {
      console.log("[OneSignal] Using registerForPushNotifications method");
      await OneSignalSDK.registerForPushNotifications();
    } else {
      console.warn("[OneSignal] No prompt method available");
    }

    console.log("[OneSignal] Waiting for user response");
    await new Promise((res) => setTimeout(res, 2000));

    const isEnabled = await OneSignalSDK.isPushNotificationsEnabled();
    console.log("[OneSignal] Permission granted:", isEnabled);

    if (isEnabled) {
      console.log("[OneSignal] Successfully subscribed");
      toast.success("Subscribed to notifications!");

      try {
        const playerId = await OneSignalSDK.getUserId();
        console.log("[OneSignal] Registering with Player ID:", playerId);

        if (playerId) {
          try {
            const response = await fetch("/api/subscribers/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ oneSignalId: playerId }),
            });

            if (response.ok) {
              console.log("[OneSignal] Successfully registered with backend");
            } else {
              console.warn(
                "[OneSignal] Failed to register with backend:",
                await response.text()
              );
            }
          } catch (registerError) {
            console.error(
              "[OneSignal] Error registering with backend:",
              registerError
            );
          }
        }
      } catch (playerIdError) {
        console.error("[OneSignal] Error getting player ID:", playerIdError);
      }
    } else {
      console.log("[OneSignal] User did not subscribe");
      toast.info(
        "You can enable notifications later from the Subscribe button."
      );
    }

    return isEnabled;
  } catch (error) {
    console.error("[OneSignal] requestNotificationPermission error:", error);
    toast.error("Failed to enable notifications.");
    return false;
  }
};
