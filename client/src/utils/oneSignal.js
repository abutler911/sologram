import OneSignal from "react-onesignal";

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    });

    await OneSignal.isPushNotificationsEnabled();
    if (typeof OneSignal.showSlidedownPrompt === "function") {
      OneSignal.showSlidedownPrompt();
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      OneSignal.setExternalUserId(userId);
    }

    return true;
  } catch (error) {
    console.error("OneSignal initialization error:", error);
    return false;
  }
};
