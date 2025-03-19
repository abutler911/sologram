import React from "react";
import styled from "styled-components";
import { FaHeart, FaCamera, FaEnvelope, FaGithub } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <TopSection>
          <LogoSection>
            <FaCamera />
            <span>SoloGram</span>
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

// Styled Components
const FooterContainer = styled.footer`
  background-color: #ffffff;
  border-top: 1px solid #e6e6e6;
  padding: 2rem 0;
  margin-top: 2rem;
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

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  color: #ff7e5f;
  font-size: 1.25rem;
  font-weight: 700;

  span {
    margin-left: 0.5rem;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
`;

const SocialLink = styled.a`
  color: #666666;
  font-size: 1.25rem;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e6e6e6;
  margin: 0 0 1.5rem 0;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 0.875rem;
`;

const CreatedWithLove = styled.p`
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  margin: 0;
`;

const HeartIcon = styled(FaHeart)`
  color: #ff7e5f;
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
  color: #6c757d;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
    text-decoration: underline;
  }
`;

export default Footer;
