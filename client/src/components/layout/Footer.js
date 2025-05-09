import React from "react";
import styled from "styled-components";
import { FaHeart, FaCamera, FaEnvelope, FaGithub } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <FooterContainer>
      <FooterContent>
        <FooterLinks>
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="mailto:abutler911@gmail.com">Contact</FooterLink>
          <FooterLink
            href="https://github.com/abutler911"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </FooterLink>
        </FooterLinks>
        <Copyright>&copy; {currentYear} SoloGram</Copyright>
      </FooterContent>
      {/* This spacer ensures content isn't hidden behind nav bar */}
      <BottomSpacer />
    </FooterContainer>
  );
};

// Instagram uses a very minimal, clean footer with subtle colors
const FooterContainer = styled.footer`
  background-color: transparent;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 20px 0 0 0; /* Remove bottom padding here */
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  color: #8e8e8e;
  margin-top: 24px;
  position: relative; /* Add position relative */
  z-index: 1; /* Ensure it stacks above content but below nav */
`;

const FooterContent = styled.div`
  max-width: 470px; // Match the Instagram feed width
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const FooterLink = styled.a`
  color: #8e8e8e;
  font-size: 12px;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  font-weight: 500;
  &:hover {
    color: #262626;
  }
`;

const Copyright = styled.p`
  margin: 0;
  color: #8e8e8e;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  margin-bottom: 12px; /* Add some space before the spacer */
`;

// This is a new component that creates space at the bottom
const BottomSpacer = styled.div`
  height: calc(60px + env(safe-area-inset-bottom, 20px));
  width: 100%;
  /* Use a fallback of 20px if env() isn't supported */
`;

export default Footer;
