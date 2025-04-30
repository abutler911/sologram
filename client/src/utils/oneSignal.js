import OneSignal from "react-onesignal";

export const initOneSignal = async () => {
  await OneSignal.init({
    appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
    allowLocalhostAsSecureOrigin: true,
    notifyButton: {
      enable: false, // we will use our own UI
    },
  });

  OneSignal.showSlidedownPrompt();

  // Optional: log permission changes
  OneSignal.on("subscriptionChange", function (isSubscribed) {
    if (isSubscribed) {
      OneSignal.getUserId().then((playerId) => {
        console.log("User subscribed with playerId:", playerId);
        // Send playerId to backend
        fetch("/api/subscribers/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ playerId }),
        });
      });
    }
  });
};
