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
    isInitializing = false;
    return false;
  }

  initPromise = new Promise(async (resolve) => {
    try {
      const OneSignal = (await import("react-onesignal")).default;
      OneSignalSDK = OneSignal;

      await OneSignal.init({
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
      });

      console.log("[OneSignal] Initialized successfully");

      if (
        OneSignal &&
        typeof OneSignal.isPushNotificationsSupported === "function"
      ) {
        const isSupported = await OneSignal.isPushNotificationsSupported();
        console.log("[OneSignal] Push supported:", isSupported);
      } else {
        console.warn("[OneSignal] isPushNotificationsSupported not available");
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

      if (initAttempts < MAX_INIT_ATTEMPTS) {
        console.log(`[OneSignal] Will retry initialization in 3 seconds`);
        setTimeout(() => {
          initPromise = null;
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
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
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
      });
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

export const requestNotificationPermission = async () => {
  try {
    if (!isInitialized) {
      const initialized = await initializeOneSignal();
      if (!initialized) {
        toast.error("Notification system not ready.");
        return false;
      }
    }

    if (!OneSignalSDK) {
      toast.error("Notification system unavailable.");
      return false;
    }

    const permission = await OneSignalSDK.getNotificationPermission();
    if (permission === "denied") {
      toast.error("Notifications are blocked in your browser settings.", {
        duration: 6000,
      });
      return false;
    }

    const alreadyEnabled = await OneSignalSDK.isPushNotificationsEnabled();
    if (alreadyEnabled) {
      toast.success("You're already subscribed to notifications!");
      return true;
    }

    if (typeof OneSignalSDK.showSlidedownPrompt === "function") {
      await OneSignalSDK.showSlidedownPrompt();
    } else if (
      typeof OneSignalSDK.registerForPushNotifications === "function"
    ) {
      await OneSignalSDK.registerForPushNotifications();
    }

    await new Promise((res) => setTimeout(res, 2000));

    const isEnabled = await OneSignalSDK.isPushNotificationsEnabled();
    if (isEnabled) {
      toast.success("Subscribed to notifications!");
    } else {
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
