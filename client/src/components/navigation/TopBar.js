// navigation/TopBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaArchive, FaSignInAlt } from 'react-icons/fa';
import { COLORS } from '../../theme';
import { LogoText } from './nav.styles';

const TopBar = ({
  logoEasterEgg,
  canCreate,
  isActive,
  isAuthenticated,
  initials,
  onNavigateProfile,
}) => (
  <Wrapper>
    <Inner>
      <LogoBrand>
        <Logo to='/' {...logoEasterEgg}>
          <LogoText>SoloGram</LogoText>
        </Logo>
        <Tagline>One Voice. Infinite Moments.</Tagline>
      </LogoBrand>
      <Actions>
        {canCreate && (
          <IconLink
            to='/story-archive'
            $active={isActive('/story-archive')}
            title='Story Archive'
          >
            <FaArchive />
          </IconLink>
        )}
        {isAuthenticated ? (
          <AvatarBtn onClick={onNavigateProfile} aria-label='Profile'>
            {initials}
          </AvatarBtn>
        ) : (
          <IconLink to='/login' title='Sign in'>
            <FaSignInAlt />
          </IconLink>
        )}
      </Actions>
    </Inner>
  </Wrapper>
);

export default TopBar;

// ── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 300;
  width: 100%;
  background: ${COLORS.background}ee;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid ${COLORS.border};
  @media (min-width: 960px) {
    display: none;
  }
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  max-width: 470px;
  margin: 0 auto;
  box-sizing: border-box;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
`;

const LogoBrand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
`;

const Tagline = styled.span`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.55rem;
  letter-spacing: 0.02em;
  color: ${COLORS.textTertiary};
  opacity: 0.9;
  line-height: 1;
  margin-top: -2px;
  padding-left: 2px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconLink = styled(Link)`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1rem;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textSecondary)};
  text-decoration: none;
  transition: color 0.15s;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const AvatarBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1.5px solid ${COLORS.primarySalmon};
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon}25,
    ${COLORS.primaryMint}25
  );
  color: ${COLORS.textPrimary};
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    transform: scale(1.08);
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}28;
  }
`;
