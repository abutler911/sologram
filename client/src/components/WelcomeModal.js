// components/WelcomeModal.js
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaTimes, FaCamera, FaLightbulb, FaBook, FaBolt } from 'react-icons/fa';
import { COLORS } from '../theme';

const STORAGE_KEY = 'sologram_welcomed';

const WelcomeModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Overlay onClick={dismiss}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <AccentLine />

        <CloseButton onClick={dismiss} aria-label='Close'>
          <FaTimes />
        </CloseButton>

        <Greeting>Welcome to</Greeting>
        <Logo>SoloGram</Logo>
        <Tagline>Andrew's corner of the internet.</Tagline>

        <Description>
          This isn't Instagram. There's no algorithm, no followers, no ads. Just
          one person documenting a life — and you're invited to look around.
        </Description>

        <FeaturesGrid>
          <Feature>
            <FeatureIcon $color={COLORS.primarySalmon}>
              <FaCamera />
            </FeatureIcon>
            <FeatureText>
              <FeatureName>Posts</FeatureName>
              <FeatureDesc>
                Photography, travel, aviation — the main feed
              </FeatureDesc>
            </FeatureText>
          </Feature>

          <Feature>
            <FeatureIcon $color={COLORS.primaryMint}>
              <FaLightbulb />
            </FeatureIcon>
            <FeatureText>
              <FeatureName>Thoughts</FeatureName>
              <FeatureDesc>
                Quick reflections — like tweets, but quieter
              </FeatureDesc>
            </FeatureText>
          </Feature>

          <Feature>
            <FeatureIcon $color={COLORS.primaryBlueGray}>
              <FaBolt />
            </FeatureIcon>
            <FeatureText>
              <FeatureName>Stories</FeatureName>
              <FeatureDesc>Moments that disappear after 24 hours</FeatureDesc>
            </FeatureText>
          </Feature>

          <Feature>
            <FeatureIcon $color={COLORS.primaryKhaki}>
              <FaBook />
            </FeatureIcon>
            <FeatureText>
              <FeatureName>Memoirs</FeatureName>
              <FeatureDesc>
                AI-written monthly snapshots of Andrew's life
              </FeatureDesc>
            </FeatureText>
          </Feature>
        </FeaturesGrid>

        <Tip>
          Look for the ✈ in the bottom corner — that's Blackbox, Andrew's AI
          co-pilot. Ask it anything.
        </Tip>

        <EnterButton onClick={dismiss}>Let's Go</EnterButton>
      </Modal>
    </Overlay>
  );
};

export default WelcomeModal;

// ── Animations ──────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// ── Overlay ─────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 11, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

// ── Modal ───────────────────────────────────────────────────────────────────

const Modal = styled.div`
  position: relative;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  padding: 36px 28px 28px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  animation: ${slideUp} 0.3s cubic-bezier(0.22, 1, 0.36, 1);

  @media (max-width: 480px) {
    padding: 22px 18px 18px;
    max-width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }
`;

const AccentLine = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    ${COLORS.primarySalmon} 0%,
    ${COLORS.primaryMint} 50%,
    ${COLORS.primaryBlueGray} 100%
  );
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  font-size: 0.9rem;
  display: flex;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.elevatedBackground};
  }
`;

// ── Header ──────────────────────────────────────────────────────────────────

const Greeting = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  margin: 0 0 4px;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Tagline = styled.p`
  font-size: 0.88rem;
  color: ${COLORS.primarySalmon};
  margin: 0 0 20px;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 0.85rem;
  line-height: 1.6;
  color: ${COLORS.textSecondary};
  margin: 0 0 24px;

  @media (max-width: 480px) {
    font-size: 0.82rem;
    margin: 0 0 16px;
  }
`;

// ── Features ────────────────────────────────────────────────────────────────

const FeaturesGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    gap: 10px;
    margin-bottom: 14px;
  }
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FeatureIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) => p.$color}15;
  border: 1px solid ${(p) => p.$color}25;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$color};
  font-size: 0.85rem;
  flex-shrink: 0;
`;

const FeatureText = styled.div`
  min-width: 0;
`;

const FeatureName = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;

const FeatureDesc = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
  line-height: 1.3;
`;

// ── Footer ──────────────────────────────────────────────────────────────────

const Tip = styled.p`
  font-size: 0.78rem;
  color: ${COLORS.textTertiary};
  line-height: 1.5;
  margin: 0 0 22px;
  padding: 12px;
  background: ${COLORS.elevatedBackground};
  border-radius: 10px;
  border: 1px solid ${COLORS.border};
`;

const EnterButton = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryBlueGray}
  );
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;
