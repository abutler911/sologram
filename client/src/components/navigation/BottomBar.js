// navigation/BottomBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
import {
  FaHome,
  FaSearch,
  FaPlus,
  FaLightbulb,
  FaUser,
  FaSignInAlt,
  FaShieldAlt,
} from 'react-icons/fa';
import { COLORS } from '../../theme';

const BottomBar = ({
  isActive,
  isAuthenticated,
  isAdmin,
  canCreate,
  initials,
  searchOpen,
  onSearchOpen,
  onCreateOpen,
}) => (
  <Wrapper>
    <Inner>
      <Tab to='/' $active={isActive('/')}>
        <TabIcon $active={isActive('/')}>
          <FaHome />
        </TabIcon>
      </Tab>

      <TabButton onClick={onSearchOpen} $active={searchOpen}>
        <TabIcon $active={searchOpen}>
          <FaSearch />
        </TabIcon>
      </TabButton>

      {canCreate ? (
        <TabButton onClick={onCreateOpen} aria-label='Create'>
          <CreateSquare>
            <FaPlus />
          </CreateSquare>
        </TabButton>
      ) : (
        <Tab to='/login'>
          <TabIcon>
            <FaSignInAlt />
          </TabIcon>
        </Tab>
      )}

      <Tab to='/thoughts' $active={isActive('/thoughts')}>
        <TabIcon $active={isActive('/thoughts')}>
          <FaLightbulb />
        </TabIcon>
      </Tab>

      {isAdmin ? (
        <Tab
          to='/media-gallery'
          $active={isActive('/media-gallery') || isActive('/admin')}
        >
          <TabIcon $active={isActive('/media-gallery') || isActive('/admin')}>
            <FaShieldAlt />
          </TabIcon>
        </Tab>
      ) : isAuthenticated ? (
        <Tab to='/profile' $active={isActive('/profile')}>
          <AvatarIcon $active={isActive('/profile')}>{initials}</AvatarIcon>
        </Tab>
      ) : (
        <Tab to='/login'>
          <TabIcon>
            <FaUser />
          </TabIcon>
        </Tab>
      )}
    </Inner>
  </Wrapper>
);

export default BottomBar;

// ── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 300;
  background: ${COLORS.background}f5;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border-top: 1px solid ${COLORS.border};
  padding-bottom: env(safe-area-inset-bottom);
  @media (min-width: 960px) {
    display: none;
  }
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 52px;
  max-width: 470px;
  margin: 0 auto;
  padding: 0 4px;
`;

const tabBase = css`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 52px;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  outline: none;
`;

const Tab = styled(Link)`
  ${tabBase}
`;
const TabButton = styled.button`
  ${tabBase}
`;

const TabIcon = styled.span`
  font-size: 1.45rem;
  display: grid;
  place-items: center;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  transition: color 0.14s, transform 0.14s;
  ${(p) =>
    p.$active &&
    css`
      transform: scale(1.12);
    `}
`;

const AvatarIcon = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: ${(p) =>
    p.$active
      ? `2px solid ${COLORS.primarySalmon}`
      : `1.5px solid ${COLORS.textTertiary}`};
  background: ${(p) =>
    p.$active
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}28, ${COLORS.primaryMint}28)`
      : 'transparent'};
  display: grid;
  place-items: center;
  font-size: 0.56rem;
  font-weight: 800;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  letter-spacing: 0.5px;
  transition: border-color 0.14s, color 0.14s;
`;

const CreateSquare = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  font-size: 1rem;
  box-shadow: 0 3px 12px ${COLORS.primarySalmon}45;
  transition: transform 0.12s, box-shadow 0.12s;
  ${TabButton}:active & {
    transform: scale(0.91);
    box-shadow: 0 1px 6px ${COLORS.primarySalmon}30;
  }
`;
