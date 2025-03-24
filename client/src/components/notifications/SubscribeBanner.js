// components/notifications/SubscribeBanner.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaBell, FaTimes } from "react-icons/fa";
import OneSignal from "react-onesignal";

const SubscribeBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [oneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    let timer;
    let checkInterval;

    const checkOneSignalReadiness = () => {
      if (typeof OneSignal?.isPushNotificationsEnabled === "function") {
        setOneSignalReady(true);
        clearInterval(checkInterval);
      }
    };

    // Check if OneSignal is already initialized
    checkOneSignalReadiness();

    // Keep checking until OneSignal is ready
    checkInterval = setInterval(checkOneSignalReadiness, 500);

    const checkSubscriptionStatus = async () => {
      if (!oneSignalReady) return;

      try {
        const isPushEnabled = await OneSignal.isPushNotificationsEnabled();
        const permission = await OneSignal.getNotificationPermission();
        const hasDismissed = localStorage.getItem("subscribeBannerDismissed");

        // Show banner if:
        // 1. User hasn't subscribed to push notifications
        // 2. User hasn't permanently dismissed the banner
        // 3. User hasn't denied notification permissions
        if (!isPushEnabled && !hasDismissed && permission !== "denied") {
          timer = setTimeout(() => {
            setShowBanner(true);
          }, 3000);
        }
      } catch (err) {
        console.error("Error checking notification status:", err);
      }
    };

    if (oneSignalReady) {
      checkSubscriptionStatus();
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [oneSignalReady]);

  const handleDismiss = () => {
    setShowBanner(false);
    // Store in localStorage that the user has dismissed the banner
    localStorage.setItem("subscribeBannerDismissed", "true");
  };

  const handleSubscribeClick = async () => {
    if (!oneSignalReady) {
      console.warn("OneSignal not ready yet");
      return;
    }

    try {
      // Show the OneSignal permission prompt
      await OneSignal.showNativePrompt();

      // Check if permission was granted after showing prompt
      const permission = await OneSignal.getNotificationPermission();

      if (permission === "granted") {
        // Permission was granted, hide the banner
        setShowBanner(false);
        localStorage.setItem("subscribeBannerDismissed", "true");
      }
    } catch (error) {
      console.error("Error showing notification prompt:", error);
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

// Styled Components
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
