// components/notifications/SubscribeBanner.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaBell, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  subscribeToNotifications,
  getPlayerId,
} from "../../utils/notificationService";

const SubscribeBanner = ({ user }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) {
      console.log("[SubscribeBanner] Skipping init — no user yet");
      return;
    }

    const checkBannerStatus = async () => {
      // Check if already subscribed via player ID
      try {
        const playerId = await getPlayerId();
        if (playerId) {
          console.log(
            "[SubscribeBanner] User already has player ID:",
            playerId
          );
          return; // Don't show banner if user already has a player ID
        }
      } catch (error) {
        // Continue anyway, better to show banner if in doubt
        console.error("[SubscribeBanner] Error checking player ID:", error);
      }

      // Check if banner was recently dismissed
      const dismissed =
        localStorage.getItem("subscribeBannerDismissed") === "true";
      const dismissedAt = localStorage.getItem("subscribeBannerDismissedAt");

      if (dismissed && dismissedAt) {
        const daysSinceDismissed =
          (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed <= 7) return;
      }

      // Show the banner if not already subscribed and not recently dismissed
      setShowBanner(true);
    };

    // Wait a moment before checking
    setTimeout(checkBannerStatus, 3000);
  }, [user?._id]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("subscribeBannerDismissed", "true");
    localStorage.setItem("subscribeBannerDismissedAt", Date.now().toString());
  };

  const handleSubscribeClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const loadingToast = toast.loading("Setting up notifications...");

    try {
      // Try to subscribe the user
      const success = await subscribeToNotifications();

      toast.dismiss(loadingToast);
      setIsLoading(false);

      if (success) {
        // Double check if we got a player ID
        const playerId = await getPlayerId();

        if (playerId) {
          toast.success("You're now subscribed to notifications!");
        } else {
          toast.success(
            "Notification prompt shown. Please accept to receive notifications."
          );
        }

        setShowBanner(false);
        localStorage.setItem("subscribeBannerDismissed", "true");
        localStorage.setItem(
          "subscribeBannerDismissedAt",
          Date.now().toString()
        );
      } else {
        toast.error(
          "Couldn't enable notifications. Please check your browser settings and try again."
        );
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      setIsLoading(false);
      console.error("[SubscribeBanner] Subscription error:", error);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  if (!showBanner) return null;

  return (
    <Banner>
      <BannerContent>
        <BannerIcon>
          <FaBell />
        </BannerIcon>
        <BannerText>
          <BannerTitle>Stay Updated</BannerTitle>
          <BannerDescription>
            Get notified when new content is posted
          </BannerDescription>
        </BannerText>
      </BannerContent>

      <BannerActions>
        <SubscribeButton onClick={handleSubscribeClick} disabled={isLoading}>
          {isLoading ? "Setting up..." : "Subscribe Now"}
        </SubscribeButton>
        <DismissButton onClick={handleDismiss} disabled={isLoading}>
          <FaTimes />
        </DismissButton>
      </BannerActions>
    </Banner>
  );
};

// Styled components
const Banner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  margin-bottom: 2rem;
  animation: slideIn 0.5s ease-out;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const BannerIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
    margin-right: 0.75rem;
  }
`;

const BannerText = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h3`
  font-size: 1.125rem;
  color: #333333;
  margin: 0 0 0.25rem;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin: 0 0 0.15rem;
  }
`;

const BannerDescription = styled.p`
  color: #666666;
  margin: 0;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    margin-top: 1rem;
    width: 100%;
    justify-content: space-between;
  }
`;

const SubscribeButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.625rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  transition: background-color 0.3s;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#ff7e5f" : "#ff6347")};
  }

  &:disabled {
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    flex: 1;
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
`;

const DismissButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #f2f2f2;
  color: #666666;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#f2f2f2" : "#e0e0e0")};
  }

  &:disabled {
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.9rem;
  }
`;

export default SubscribeBanner;
