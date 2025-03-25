// components/notifications/SubscribeBanner.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaBell, FaTimes } from "react-icons/fa";
import {
  isOneSignalReady,
  requestNotificationPermission,
} from "../../utils/oneSignal";
import { toast } from "react-hot-toast";

const SubscribeBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    let timer;
    let readinessTimer;

    // Function to check if OneSignal is ready
    const checkOneSignalReadiness = () => {
      if (isOneSignalReady()) {
        setOneSignalReady(true);
        return true;
      }
      return false;
    };

    // Set up a polling mechanism to check if OneSignal is ready
    readinessTimer = setInterval(() => {
      if (checkOneSignalReadiness()) {
        clearInterval(readinessTimer);
        checkSubscriptionStatus();
      }
    }, 1000);

    // Clean up the timer after 10 seconds to avoid infinite polling
    setTimeout(() => {
      clearInterval(readinessTimer);
    }, 10000);

    const checkSubscriptionStatus = async () => {
      try {
        const OneSignal = window.OneSignal;
        if (!OneSignal) return;

        const isPushEnabled = await OneSignal.isPushNotificationsEnabled();
        const permission = await OneSignal.getNotificationPermission();

        console.log("[SubscribeBanner] Push enabled:", isPushEnabled);
        console.log("[SubscribeBanner] Permission status:", permission);

        // Don't show banner if notifications are already enabled
        if (isPushEnabled) return;

        // Don't show banner if permission is denied (user explicitly blocked)
        if (permission === "denied") return;

        // Check if user has dismissed the banner before
        const hasDismissed = localStorage.getItem("subscribeBannerDismissed");
        const dismissedTimestamp = localStorage.getItem(
          "subscribeBannerDismissedAt"
        );

        let shouldShow = !hasDismissed;

        // If it was dismissed more than 7 days ago, show it again
        if (dismissedTimestamp) {
          const dismissedDate = new Date(parseInt(dismissedTimestamp));
          const now = new Date();
          const daysSinceDismissed =
            (now - dismissedDate) / (1000 * 60 * 60 * 24);

          if (daysSinceDismissed > 7) {
            shouldShow = true;
          }
        }

        if (shouldShow) {
          // Set a delay before showing the banner
          timer = setTimeout(() => {
            console.log("[SubscribeBanner] Showing banner");
            setShowBanner(true);
          }, 5000); // Show after 5 seconds on the site
        }
      } catch (err) {
        console.error("Error checking notification status:", err);
      }
    };

    return () => {
      if (timer) clearTimeout(timer);
      if (readinessTimer) clearInterval(readinessTimer);
    };
  }, [oneSignalReady]);

  const handleDismiss = () => {
    setShowBanner(false);
    // Store current timestamp when dismissed
    localStorage.setItem("subscribeBannerDismissed", "true");
    localStorage.setItem("subscribeBannerDismissedAt", Date.now().toString());
  };

  const handleSubscribeClick = async () => {
    try {
      const result = await requestNotificationPermission();

      if (result) {
        setShowBanner(false);
        toast.success("Successfully subscribed to notifications!");
        localStorage.setItem("subscribeBannerDismissed", "true");
        localStorage.setItem(
          "subscribeBannerDismissedAt",
          Date.now().toString()
        );
      } else {
        // Check the reason why it failed
        if (window.OneSignal) {
          const permission = await window.OneSignal.getNotificationPermission();

          if (permission === "denied") {
            toast.error(
              "Notifications are blocked. Please update your browser settings."
            );
            setShowBanner(false);
          }
        }
      }
    } catch (error) {
      console.error("Error showing notification prompt:", error);
      toast.error("There was a problem subscribing to notifications.");
    }
  };

  // Only render the banner if we should show it
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
        <SubscribeButton onClick={handleSubscribeClick}>
          Subscribe Now
        </SubscribeButton>
        <DismissButton onClick={handleDismiss}>
          <FaTimes />
        </DismissButton>
      </BannerActions>
    </Banner>
  );
};

// Styled Components (unchanged)
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

  &:hover {
    background-color: #ff6347;
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

  &:hover {
    background-color: #e0e0e0;
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.9rem;
  }
`;

export default SubscribeBanner;
