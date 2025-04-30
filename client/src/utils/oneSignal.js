import OneSignal from "react-onesignal";

export const initOneSignal = async () => {
  try {
    if (!window.OneSignal || typeof OneSignal.init !== "function") {
      console.warn("[OneSignal] SDK not ready yet");
      return;
    }

    console.log("[OneSignal] Initializing...");
    await OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });

    console.log("[OneSignal] Showing prompt");
    OneSignal.showSlidedownPrompt();

    OneSignal.on("subscriptionChange", async (isSubscribed) => {
      if (isSubscribed) {
        const playerId = await OneSignal.getUserId();
        console.log("[OneSignal] playerId:", playerId);

        await fetch("/api/subscribers/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ playerId }),
        });
      }
    });
  } catch (err) {
    console.error("[OneSignal] Error during init:", err);
  }
};
