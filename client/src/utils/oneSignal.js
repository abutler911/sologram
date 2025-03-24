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

    // ✅ Ensure methods only run when SDK is ready
    OneSignal.push(async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        await OneSignal.setExternalUserId(userId);
      }

      if (typeof OneSignal.showSlidedownPrompt === "function") {
        OneSignal.showSlidedownPrompt();
      } else {
        console.warn("showSlidedownPrompt not available yet.");
      }
    });

    return true;
  } catch (error) {
    console.error("OneSignal initialization error:", error);
    return false;
  }
};
