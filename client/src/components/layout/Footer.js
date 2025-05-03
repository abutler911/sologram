import React from "react";
import styled from "styled-components";
import { FaHeart, FaCamera, FaEnvelope, FaGithub } from "react-icons/fa";
import { COLORS } from "../../theme";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <FooterContainer>
      <FooterContent>
        <TopSection>
          <LogoSection>
            <div className="logo">
              <FaCamera className="icon" />
              <span>SoloGram</span>
            </div>
            <div className="tagline">One Voice. Infinite Moments.</div>
          </LogoSection>
          <SocialLinks>
            <SocialLink href="mailto:abutler911@gmail.com" aria-label="Email">
              <FaEnvelope />
            </SocialLink>
            <SocialLink
              href="https://github.com/abutler911"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <FaGithub />
            </SocialLink>
          </SocialLinks>
        </TopSection>
        <Divider />
        <BottomSection>
          <Copyright>
            &copy; {currentYear} SoloGram. All rights reserved.
          </Copyright>
          <CreatedWithLove>
            Created with <HeartIcon /> by Andrew
          </CreatedWithLove>
          <FooterLinks>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
          </FooterLinks>
        </BottomSection>
      </FooterContent>
    </FooterContainer>
  );
};

const FooterContainer = styled.footer`
  background-color: ${COLORS.background};
  border-top: 1px solid ${COLORS.border};
  padding: 2rem 0;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom));
  margin-bottom: 65px;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    align-items: flex-start;
  }
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  color: ${COLORS.primaryBlueGray};

  .logo {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;

    .icon {
      font-size: 1.5rem;
      margin-right: 0.5rem;
    }
  }

  .tagline {
    font-size: 0.9rem;
    font-style: italic;
    color: ${COLORS.accentSalmon};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1.25rem;

  a {
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }
`;

const SocialLink = styled.a`
  color: ${COLORS.textSecondary};
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${COLORS.divider};
  margin-bottom: 1.5rem;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${COLORS.textTertiary};
  margin: 0;
  font-size: 0.875rem;
`;

const CreatedWithLove = styled.p`
  color: ${COLORS.textTertiary};
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  margin: 0;
`;

const HeartIcon = styled(FaHeart)`
  color: ${COLORS.heartRed};
  margin: 0 0.25rem;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const FooterLink = styled.a`
  color: ${COLORS.textSecondary};
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.accentMint};
    text-decoration: underline;
  }
`;

export default Footer;
