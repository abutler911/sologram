import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaBell, FaTimes } from "react-icons/fa";
import SubscriptionForm from "./SubscriptionForm";

const SubscribeBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the banner has been dismissed
    const hasBannerBeenDismissed = localStorage.getItem(
      "subscribeBannerDismissed"
    );

    if (!hasBannerBeenDismissed) {
      // Show the banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("subscribeBannerDismissed", "true");
  };

  const handleToggleModal = () => {
    setIsOpen(!isOpen);

    // If closing the modal, mark the banner as dismissed
    if (isOpen) {
      setShowBanner(false);
      localStorage.setItem("subscribeBannerDismissed", "true");
    }
  };

  return (
    <>
      {showBanner && (
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
            <SubscribeButton onClick={handleToggleModal}>
              Subscribe Now
            </SubscribeButton>
            <DismissButton onClick={handleDismiss}>
              <FaTimes />
            </DismissButton>
          </BannerActions>
        </Banner>
      )}

      {/* Fixed Subscribe Button */}
      <SubscribeFixed onClick={handleToggleModal}>
        <FaBell />
        <span>Subscribe</span>
      </SubscribeFixed>

      {/* Subscription Modal */}
      {isOpen && (
        <ModalOverlay>
          <ModalContent>
            <CloseButton onClick={handleToggleModal}>
              <FaTimes />
            </CloseButton>
            <SubscriptionForm />
          </ModalContent>
        </ModalOverlay>
      )}
    </>
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

const SubscribeFixed = styled.button`
  position: fixed;
  bottom: 7rem;
  right: 2rem;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 98;
  transition: transform 0.2s, background-color 0.3s;

  &:hover {
    background-color: #ff6347;
    transform: translateY(-2px);
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    bottom: 5rem;
    right: 1rem;
    padding: 0.625rem 1rem;

    span {
      display: none;
    }

    svg {
      margin-right: 0;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 1.5rem;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    margin: 0 1rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -1rem;
  right: -1rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #333333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  z-index: 1;
  transition: background-color 0.3s;

  &:hover {
    background-color: #555555;
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.9rem;
    top: -0.875rem;
    right: -0.875rem;
  }
`;

export default SubscribeBanner;
