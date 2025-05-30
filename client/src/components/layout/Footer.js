import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaHeart, FaCamera, FaEnvelope, FaGithub } from "react-icons/fa";
import { COLORS, THEME } from "../../theme";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [swVersion, setSwVersion] = useState(null);

  useEffect(() => {
    // Get service worker version
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Check if we can get version from SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SW_VERSION") {
          setSwVersion(event.data.version);
        }
      });

      // Request version from service worker
      navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" });
    }

    // Fallback: try to get version from a global variable or localStorage
    const version =
      localStorage.getItem("app_version") ||
      window.APP_VERSION ||
      `v${new Date().toISOString().slice(0, 10)}`;
    setSwVersion(version);
  }, []);

  return (
    <FooterContainer>
      <FooterContent>
        <FooterBrand>
          <BrandIcon>
            <FaCamera />
          </BrandIcon>
          <BrandText>SoloGram</BrandText>
        </FooterBrand>

        <FooterLinks>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="mailto:abutler911@gmail.com">
            <FaEnvelope />
            Contact
          </FooterLink>
          <FooterLink
            href="https://github.com/abutler911"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub />
            GitHub
          </FooterLink>
        </FooterLinks>

        <FooterDivider />

        <FooterBottom>
          <Copyright>
            Independently Developed with{" "}
            <HeartIcon>
              <FaHeart />
            </HeartIcon>{" "}
            by Andrew
          </Copyright>
          <CopyrightLine>&copy; {currentYear} SoloGram</CopyrightLine>
          <TagLine>One Voice. Infinite Moments</TagLine>
          {swVersion && <VersionDisplay>{swVersion}</VersionDisplay>}
        </FooterBottom>
      </FooterContent>

      {/* This spacer ensures content isn't hidden behind nav bar */}
      <BottomSpacer />
    </FooterContainer>
  );
};

// All your existing styled components stay the same...
const FooterContainer = styled.footer`
  background: linear-gradient(
    135deg,
    ${COLORS.cardBackground} 0%,
    ${COLORS.elevatedBackground} 100%
  );
  border-top: 1px solid ${COLORS.divider};
  padding: 32px 0 0 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  color: ${COLORS.textSecondary};
  margin-top: 0;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 24px 0 0 0;
    margin-top: 0;
  }
`;

const FooterContent = styled.div`
  max-width: 470px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const FooterBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const BrandIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(
    45deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(233, 137, 115, 0.3);
`;

const BrandText = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: ${COLORS.textPrimary};
  background: linear-gradient(
    45deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 20px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    gap: 16px;
  }
`;

const FooterLink = styled.a`
  color: ${COLORS.textSecondary};
  font-size: 13px;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.elevatedBackground};
    border-color: ${COLORS.border};
    transform: translateY(-1px);
  }

  svg {
    font-size: 12px;
  }
`;

const FooterDivider = styled.div`
  width: 60px;
  height: 2px;
  background: linear-gradient(
    90deg,
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  border-radius: 1px;
  margin-bottom: 20px;
  opacity: 0.6;
`;

const FooterBottom = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const Copyright = styled.p`
  margin: 0;
  color: ${COLORS.textSecondary};
  font-size: 12px;
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const HeartIcon = styled.span`
  color: ${COLORS.heartRed};
  animation: heartbeat 2s ease-in-out infinite;

  @keyframes heartbeat {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const CopyrightLine = styled.p`
  margin: 0;
  color: ${COLORS.textTertiary};
  font-size: 11px;
  font-weight: 300;
  opacity: 0.7;
  text-align: center;
`;

const TagLine = styled.p`
  margin: 0;
  color: ${COLORS.textTertiary};
  font-size: 11px;
  font-style: italic;
  font-weight: 300;
  opacity: 0.8;
`;

// NEW: Version display component
const VersionDisplay = styled.p`
  margin: 4px 0 0 0;
  color: ${COLORS.textTertiary};
  font-size: 9px;
  font-weight: 300;
  opacity: 0.6;
  font-family: "Courier New", monospace;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;

  &:hover {
    opacity: 1;
    cursor: pointer;
  }
`;

// This creates space at the bottom for mobile navigation
const BottomSpacer = styled.div`
  height: calc(60px + env(safe-area-inset-bottom, 20px));
  width: 100%;
  background: ${COLORS.elevatedBackground}; /* Removed gradient as discussed */
`;

export default Footer;
