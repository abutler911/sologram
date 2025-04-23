import axios from "axios";
import { toast } from "react-hot-toast";

export const registerOneSignalPlayerId = async () => {
  try {
    const playerId = await window.OneSignal?.getUserId();

    if (!playerId) {
      console.warn("[OneSignal] No player ID available yet.");
      return;
    }

    const res = await axios.post("/api/subscribers/register", { playerId });

    if (res.data.success) {
      toast.success("You're now subscribed to notifications.");
    } else {
      toast.error("Subscription registered but failed to save.");
    }
  } catch (err) {
    console.error("Failed to register OneSignal Player ID:", err);
    toast.error("Error saving your subscription.");
  }
};
