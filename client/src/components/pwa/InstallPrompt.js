import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaDownload, FaTimes, FaCamera } from "react-icons/fa";

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Listen for the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome from automatically showing the default prompt
      e.preventDefault();

      // Store the event to trigger it later
      setDeferredPrompt(e);

      // Check if we've previously dismissed this prompt
      const promptDismissed = localStorage.getItem("installPromptDismissed");
      const lastPromptTime = localStorage.getItem("lastPromptTime");

      // Show our custom prompt if:
      // 1. It hasn't been dismissed before, or
      // 2. It's been more than 30 days since it was last dismissed
      if (
        !promptDismissed ||
        (lastPromptTime &&
          Date.now() - parseInt(lastPromptTime, 10) > 30 * 24 * 60 * 60 * 1000)
      ) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Handle the install button click
  const handleInstall = () => {
    if (!deferredPrompt) return;

    // Show the installation prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
        // Store that the user dismissed the prompt
        localStorage.setItem("installPromptDismissed", "true");
        localStorage.setItem("lastPromptTime", Date.now().toString());
      }

      // Reset the deferredPrompt as it can't be used again
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  // Handle dismiss
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "true");
    localStorage.setItem("lastPromptTime", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <PromptContainer>
      <PromptContent>
        <LogoContainer>
          <LogoWrapper>
            <FaCamera />
            <AppName>SoloGram</AppName>
          </LogoWrapper>
          <Tagline>One Voice. Infinite Moments.</Tagline>
        </LogoContainer>

        <PromptMessage>
          <PromptTitle>Install SoloGram</PromptTitle>
          <PromptText>
            Add to your home screen for a better experience
          </PromptText>
        </PromptMessage>

        <PromptActions>
          <InstallButton onClick={handleInstall}>
            <FaDownload />
            <span>Install</span>
          </InstallButton>

          <DismissButton onClick={handleDismiss}>
            <FaTimes />
            <span>Not Now</span>
          </DismissButton>
        </PromptActions>
      </PromptContent>
    </PromptContainer>
  );
};

// Styled Components
const PromptContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #1e1e1e;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  padding: 1rem;

  @media (min-width: 768px) {
    bottom: 2rem;
    left: 2rem;
    right: auto;
    max-width: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const PromptContent = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
    margin-right: 1rem;
    min-width: 100px;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;

  svg {
    font-size: 1.5rem;
    color: #ff7e5f;
    margin-right: 0.5rem;
  }
`;

const AppName = styled.span`
  color: #ff7e5f;
  font-weight: 600;
`;

const Tagline = styled.small`
  font-size: 0.7rem;
  font-style: italic;
  color: #888;
  margin-top: 0.2rem;
  margin-left: 2rem; /* Align with the text after the icon */
`;

const PromptMessage = styled.div`
  flex: 1;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    margin-bottom: 0;
  }
`;

const PromptTitle = styled.h3`
  color: white;
  font-size: 1.125rem;
  margin: 0 0 0.25rem 0;
`;

const PromptText = styled.p`
  color: #dddddd;
  font-size: 0.875rem;
  margin: 0;
`;

const PromptActions = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (min-width: 768px) {
    margin-left: 1rem;
  }
`;

const InstallButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const DismissButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  color: #dddddd;
  border: 1px solid #444444;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #333333;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

export default InstallPrompt;
