// utils/oneSignal.js
import OneSignal from "react-onesignal";

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      notifyButton: {
        enable: true,
        position: "bottom-right",
        showCredit: false,
      },
      allowLocalhostAsSecureOrigin: true,
    });

    OneSignal.showSlidedownPrompt();

    // When user subscribes, get their ID and send to backend
    OneSignal.on("subscriptionChange", async function (isSubscribed) {
      if (isSubscribed) {
        try {
          const userId = localStorage.getItem("userId");
          if (userId) {
            OneSignal.setExternalUserId(userId);
          }
        } catch (error) {
          console.error("Error getting OneSignal user ID:", error);
        }
      }
    });

    return true;
  } catch (error) {
    console.error("OneSignal initialization error:", error);
    return false;
  }
};

// Function to save the OneSignal player ID to your backend
// const savePushId = async (pushId) => {
//   try {
//     // Get user phone from localStorage or state
//     const phone = localStorage.getItem("userPhone");

//     if (!phone) {
//       console.warn("No phone number available to associate with push ID");
//       return;
//     }

//     // Send to your API
//     const response = await fetch("/api/subscribers/push-id", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ phone, pushId }),
//     });

//     const data = await response.json();

//     if (!data.success) {
//       console.error("Error saving push ID:", data.message);
//     }
//   } catch (error) {
//     console.error("Error saving push ID:", error);
//   }
// };
