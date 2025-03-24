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

    // OPTIONAL: set external user ID if available
    const userId = localStorage.getItem("userId");
    if (userId && typeof OneSignal.setExternalUserId === "function") {
      await OneSignal.setExternalUserId(userId);
    }

    // OPTIONAL: show slide-down prompt if available
    if (typeof OneSignal.showSlidedownPrompt === "function") {
      OneSignal.showSlidedownPrompt();
    }

    return true;
  } catch (error) {
    console.error("OneSignal initialization error:", error);
    return false;
  }
};
