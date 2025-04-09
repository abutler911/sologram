// components/notifications/SubscribeBanner.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaBell, FaTimes } from "react-icons/fa";
import {
  isOneSignalReady,
  requestNotificationPermission,
  checkNotificationCompatibility,
  getNotificationDiagnostics,
} from "../../utils/oneSignal";
import { toast } from "react-hot-toast";

const SubscribeBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if banner was recently dismissed
    const checkBannerStatus = async () => {
      // Don't show banner immediately on page load - wait a bit
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Check if the banner was dismissed recently
      const dismissedTimestamp = localStorage.getItem(
        "subscribeBannerDismissedAt"
      );
      const hasDismissed =
        localStorage.getItem("subscribeBannerDismissed") === "true";

      let shouldShow = !hasDismissed;

      // If it was dismissed more than 7 days ago, show it again
      if (dismissedTimestamp) {
        const dismissedDate = new Date(parseInt(dismissedTimestamp, 10));
        const now = new Date();
        const daysSinceDismissed =
          (now - dismissedDate) / (1000 * 60 * 60 * 24);

        if (daysSinceDismissed > 7) {
          shouldShow = true;
        }
      }

      // Only check subscription status if we're considering showing the banner
      if (shouldShow) {
        // Wait until OneSignal is ready before checking subscription status
        let timeoutCounter = 0;
        const maxTimeouts = 10; // Maximum number of 1-second intervals to wait

        const checkOneSignalInterval = setInterval(async () => {
          timeoutCounter++;

          if (isOneSignalReady()) {
            clearInterval(checkOneSignalInterval);

            try {
              // Check if already subscribed
              const isPushEnabled =
                await window.OneSignal.isPushNotificationsEnabled();

              if (!isPushEnabled) {
                // Check if permission is denied
                const permission =
                  await window.OneSignal.getNotificationPermission();

                if (permission !== "denied") {
                  setShowBanner(true);
                }
              }
            } catch (err) {
              console.error("Error checking OneSignal status:", err);
            }
          } else if (timeoutCounter >= maxTimeouts) {
            // Give up after 10 seconds
            clearInterval(checkOneSignalInterval);
            console.log(
              "OneSignal not available after 10 seconds, not showing banner"
            );
          }
        }, 1000);
      }
    };

    checkBannerStatus();
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    // Store current timestamp when dismissed
    localStorage.setItem("subscribeBannerDismissed", "true");
    localStorage.setItem("subscribeBannerDismissedAt", Date.now().toString());
  };

  const handleSubscribeClick = async () => {
    const loadingToast = toast.loading("Preparing notifications...");

    try {
      // Check browser compatibility first
      const isCompatible = checkNotificationCompatibility();

      if (!isCompatible) {
        toast.dismiss(loadingToast);
        toast.error(
          "Your browser doesn't support notifications. Please try a different browser like Chrome or Firefox.",
          { duration: 5000 }
        );
        return;
      }

      // Try to request permission
      const result = await requestNotificationPermission();

      toast.dismiss(loadingToast);

      if (result) {
        setShowBanner(false);
        localStorage.setItem("subscribeBannerDismissed", "true");
        localStorage.setItem(
          "subscribeBannerDismissedAt",
          Date.now().toString()
        );
      } else {
        // Permission failure already shows a toast from the requestNotificationPermission function
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Error in handleSubscribeClick:", error);

      // Show diagnostics for debugging
      const diagnostics = getNotificationDiagnostics();
      console.debug("Notification diagnostics:", diagnostics);

      toast.error("There was a problem with the notification system.");
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

// Styled components remain the same...
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
