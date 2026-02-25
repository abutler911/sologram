import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaHome } from 'react-icons/fa';
import { COLORS } from '../theme';

const NotFound = () => (
  <Container>
    <LogoSig>SoloGram</LogoSig>

    <Code>404</Code>

    <Title>Page Not Found</Title>

    <Message>
      The page you're looking for doesn't exist or has been moved.
    </Message>

    <HomeLink to='/'>
      <FaHome />
      <span>Back to Home</span>
    </HomeLink>
  </Container>
);

export default NotFound;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: calc(100vh - 120px);
  background: ${COLORS.background};
  animation: ${fadeUp} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

  @font-face {
    font-family: 'Autography';
    src: url('/fonts/Autography.woff2') format('woff2');
    font-display: swap;
  }
`;

const LogoSig = styled.span`
  font-family: 'Autography', cursive;
  font-size: 2.4rem;
  line-height: 1.3;
  margin-bottom: 2rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Code = styled.h1`
  font-size: clamp(5rem, 18vw, 8rem);
  font-weight: 900;
  line-height: 1;
  margin: 0 0 0.75rem;
  letter-spacing: -0.05em;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem;
  letter-spacing: -0.02em;
`;

const Message = styled.p`
  font-size: 1rem;
  color: ${COLORS.textSecondary};
  max-width: 420px;
  line-height: 1.6;
  margin: 0 0 2.5rem;
`;

const HomeLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 700;
  box-shadow: 0 6px 20px ${COLORS.primarySalmon}44;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 10px 28px ${COLORS.primarySalmon}55;
  }

  &:active {
    transform: translateY(0);
  }
`;
