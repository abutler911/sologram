import React from 'react';
import styled from 'styled-components';
import { FaHeart, FaCamera, FaEnvelope, FaGithub } from 'react-icons/fa';
import { COLORS } from '../../theme';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
          <FooterLink href='/about'>About</FooterLink>
          <FooterLink href='/privacy'>Privacy</FooterLink>
          <FooterLink href='/terms'>Terms</FooterLink>
          <FooterLink href='mailto:abutler911@gmail.com'>
            <FaEnvelope />
            Contact
          </FooterLink>
          <FooterLink
            href='https://github.com/abutler911'
            target='_blank'
            rel='noopener noreferrer'
          >
            <FaGithub />
            GitHub
          </FooterLink>
        </FooterLinks>

        <FooterDivider />

        <FooterBottom>
          <Copyright>
            Independently developed with{' '}
            <Heart>
              <FaHeart />
            </Heart>{' '}
            by Andrew
          </Copyright>
          <CopyrightLine>&copy; {currentYear} SoloGram</CopyrightLine>
          <TagLine>One Voice. Infinite Moments.</TagLine>
        </FooterBottom>
      </FooterContent>

      {/* Spacer so content clears the mobile bottom tab bar */}
      <BottomSpacer />
    </FooterContainer>
  );
};

// ── Styled components ─────────────────────────────────────────────────────────

const FooterContainer = styled.footer`
  background: ${COLORS.cardBackground};
  border-top: 1px solid ${COLORS.border};
  padding: 32px 0 0;
  color: ${COLORS.textSecondary};

  @media (max-width: 768px) {
    padding: 24px 0 0;
  }
`;

const FooterContent = styled.div`
  max-width: 470px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FooterBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const BrandIcon = styled.div`
  width: 30px;
  height: 30px;
  background: linear-gradient(
    45deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 14px;
`;

const BrandText = styled.span`
  font-size: 17px;
  font-weight: 700;
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
  gap: 4px;
  margin-bottom: 20px;
`;

const FooterLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: ${COLORS.textSecondary};
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  padding: 6px 10px;
  border-radius: 8px;
  transition: color 0.12s, background 0.12s;

  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.elevatedBackground};
  }

  svg {
    font-size: 11px;
  }
`;

const FooterDivider = styled.div`
  width: 48px;
  height: 2px;
  background: linear-gradient(
    90deg,
    ${COLORS.primaryBlueGray},
    ${COLORS.primaryMint}
  );
  border-radius: 1px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const FooterBottom = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
`;

const Copyright = styled.p`
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: ${COLORS.textSecondary};
  font-size: 12px;
`;

const Heart = styled.span`
  color: ${COLORS.heartRed};
  display: flex;
  align-items: center;
  font-size: 11px;
`;

const CopyrightLine = styled.p`
  margin: 0;
  color: ${COLORS.textTertiary};
  font-size: 11px;
  opacity: 0.7;
`;

const TagLine = styled.p`
  margin: 0;
  color: ${COLORS.textTertiary};
  font-size: 11px;
  font-style: italic;
  opacity: 0.7;
`;

// Pushes page content clear of the mobile bottom tab bar
const BottomSpacer = styled.div`
  height: calc(60px + env(safe-area-inset-bottom, 20px));

  /* Desktop — no tab bar, no spacer needed */
  @media (min-width: 768px) {
    height: 0;
  }
`;

export default Footer;
