// navigation/Sidebar.js
// Redesigned: warm editorial aesthetic, clear nav/action separation,
// gradient Create CTA, refined hover micro-interactions.
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import {
  FaBook,
  FaHome,
  FaSearch,
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaLightbulb,
  FaRobot,
  FaSignInAlt,
  FaSignOutAlt,
  FaImages,
  FaArchive,
  FaMagic,
} from 'react-icons/fa';
import { COLORS } from '../../theme';
import { LogoText } from './nav.styles';

const SIDEBAR_FULL = '250px';
const SIDEBAR_NARROW = '74px';

const Sidebar = ({
  logoEasterEgg,
  isActive,
  isAuthenticated,
  isAdmin,
  canCreate,
  user,
  initials,
  onLogout,
  onSearchOpen,
  onCreateOpen,
  onPaletteOpen,
}) => (
  <Wrapper>
    <Inner>
      {/* Logo */}
      <LogoLink to='/' {...logoEasterEgg}>
        <NarrowMark>S</NarrowMark>
        <LogoWrap>
          <SideLogoText>SoloGram</SideLogoText>
          <Tagline>One Voice. Infinite Moments.</Tagline>
        </LogoWrap>
      </LogoLink>

      <Divider />

      {/* Primary destinations */}
      <Nav>
        <NavLink to='/' $active={isActive('/')}>
          <Icon>
            <FaHome />
          </Icon>
          <Label>Home</Label>
        </NavLink>
        <NavLink to='/thoughts' $active={isActive('/thoughts')}>
          <Icon>
            <FaLightbulb />
          </Icon>
          <Label>Thoughts</Label>
        </NavLink>
        <NavLink to='/collections' $active={isActive('/collections')}>
          <Icon>
            {isActive('/collections') ? <FaFolderOpen /> : <FaFolder />}
          </Icon>
          <Label>Collections</Label>
        </NavLink>
        <NavLink to='/memoirs' $active={isActive('/memoirs')}>
          <Icon>
            <FaBook />
          </Icon>
          <Label>Memoirs</Label>
        </NavLink>
        {canCreate && (
          <NavLink to='/story-archive' $active={isActive('/story-archive')}>
            <Icon>
              <FaArchive />
            </Icon>
            <Label>Story Archive</Label>
          </NavLink>
        )}
      </Nav>

      {/* Create CTA */}
      {canCreate && (
        <CreateWrap>
          <CreateButton onClick={onCreateOpen}>
            <CreateIconWrap>
              <FaPlus />
            </CreateIconWrap>
            <CreateLabel>Create</CreateLabel>
          </CreateButton>
        </CreateWrap>
      )}

      <Spacer />

      {/* Admin section */}
      {isAdmin && (
        <>
          <SectionLabel>Admin</SectionLabel>
          <Nav>
            <NavLink to='/media-gallery' $active={isActive('/media-gallery')}>
              <Icon>
                <FaImages />
              </Icon>
              <Label>Media Gallery</Label>
            </NavLink>
            <NavLink
              to='/admin/ai-content'
              $active={isActive('/admin/ai-content')}
            >
              <Icon>
                <FaRobot />
              </Icon>
              <Label>AI Content</Label>
            </NavLink>
          </Nav>
          <Divider />
        </>
      )}

      {/* Utility zone (bottom) */}
      <Nav>
        <NavButton onClick={onSearchOpen}>
          <Icon>
            <FaSearch />
          </Icon>
          <Label>Search</Label>
        </NavButton>

        {isAuthenticated ? (
          <>
            <NavLink to='/profile' $active={isActive('/profile')}>
              <AvatarIcon $active={isActive('/profile')}>{initials}</AvatarIcon>
              <Label>{user?.username || 'Profile'}</Label>
            </NavLink>
            <NavButton onClick={onLogout} $danger>
              <Icon>
                <FaSignOutAlt />
              </Icon>
              <Label>Logout</Label>
            </NavButton>
          </>
        ) : (
          <NavLink to='/login'>
            <Icon>
              <FaSignInAlt />
            </Icon>
            <Label>Sign In</Label>
          </NavLink>
        )}
      </Nav>

      {/* Command palette hint */}
      <PaletteBtn onClick={onPaletteOpen}>
        <FaMagic />
        <PaletteBtnLabel>Command</PaletteBtnLabel>
        <KbdGroup>
          <Kbd>&#8984;</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </PaletteBtn>
    </Inner>
  </Wrapper>
);

export default Sidebar;

// ── Animations ───────────────────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const glowPulse = keyframes`
  0%, 100% { box-shadow: 0 2px 16px ${COLORS.primarySalmon}30, 0 0 0 0 ${COLORS.primarySalmon}00; }
  50%      { box-shadow: 0 4px 24px ${COLORS.primarySalmon}45, 0 0 0 3px ${COLORS.primarySalmon}10; }
`;

// ── Sidebar shell ────────────────────────────────────────────────────────────

const Wrapper = styled.aside`
  display: none;
  @media (min-width: 960px) {
    display: flex;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${SIDEBAR_NARROW};
    z-index: 300;
    background: linear-gradient(
      180deg,
      ${COLORS.background} 0%,
      #151515 50%,
      ${COLORS.background} 100%
    );
    border-right: 1px solid ${COLORS.border}88;
    transition: width 0.2s ease;
  }
  @media (min-width: 1200px) {
    width: ${SIDEBAR_FULL};
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 14px 0 16px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

// ── Logo ─────────────────────────────────────────────────────────────────────

const NarrowMark = styled.span`
  font-family: 'Autography', cursive;
  font-size: 2.2rem;
  line-height: 1;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  flex-shrink: 0;
  display: block;
  @media (min-width: 1200px) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  margin: 0 10px 2px;
  padding: 12px;
  border-radius: 14px;
  height: 52px;
  justify-content: center;
  transition: background 0.2s ease;
  &:hover {
    background: ${COLORS.elevatedBackground}60;
  }
  @media (min-width: 1200px) {
    justify-content: flex-start;
  }
`;

const SideLogoText = styled(LogoText)`
  font-size: 1.7rem;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const LogoWrap = styled.div`
  display: none;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  @media (min-width: 1200px) {
    display: flex;
  }
`;

const Tagline = styled.span`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.58rem;
  letter-spacing: 0.03em;
  color: ${COLORS.textTertiary};
  opacity: 0.5;
  line-height: 1;
  white-space: nowrap;
`;

// ── Divider ──────────────────────────────────────────────────────────────────

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    ${COLORS.border}80 30%,
    ${COLORS.border}80 70%,
    transparent 100%
  );
  margin: 10px 16px;
`;

// ── Nav list ─────────────────────────────────────────────────────────────────

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
`;

const itemBase = css`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
  position: relative;
  justify-content: center;
  transition: all 0.18s ease;

  background: transparent;
  color: ${(p) => (p.$active ? COLORS.textPrimary : COLORS.textTertiary)};

  ${(p) =>
    p.$active &&
    css`
      background: linear-gradient(
        135deg,
        ${COLORS.primarySalmon}14,
        ${COLORS.primaryMint}0a
      );
      color: ${COLORS.textPrimary};
      font-weight: 600;
    `}

  ${(p) =>
    p.$active &&
    css`
      &::after {
        content: '';
        position: absolute;
        left: 2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: ${COLORS.primarySalmon};
        @media (min-width: 1200px) {
          width: 3px;
          height: 18px;
          border-radius: 0 4px 4px 0;
          left: 0;
        }
      }
    `}

  &:hover {
    background: ${(p) =>
      p.$active
        ? `linear-gradient(135deg, ${COLORS.primarySalmon}1c, ${COLORS.primaryMint}10)`
        : `${COLORS.elevatedBackground}90`};
    color: ${COLORS.textPrimary};
    transform: translateX(2px);
  }

  ${(p) =>
    p.$danger &&
    css`
      color: ${COLORS.textTertiary};
      &:hover {
        color: ${COLORS.error};
        background: ${COLORS.error}10;
        transform: translateX(2px);
      }
    `}

  @media (min-width: 1200px) {
    justify-content: flex-start;
    padding: 10px 14px;
  }
`;

const NavLink = styled(Link)`
  ${itemBase}
`;
const NavButton = styled.button`
  ${itemBase}
`;

const Icon = styled.span`
  font-size: 1.15rem;
  display: grid;
  place-items: center;
  width: 24px;
  flex-shrink: 0;
  transition: transform 0.18s ease;
  ${NavLink}:hover &,
  ${NavButton}:hover & {
    transform: scale(1.1);
  }
`;

const Label = styled.span`
  white-space: nowrap;
  letter-spacing: 0.01em;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

// ── Create button (gradient pill) ────────────────────────────────────────────

const CreateWrap = styled.div`
  padding: 12px 10px 4px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primarySalmon}dd,
    ${COLORS.accentSalmon}
  );
  background-size: 200% auto;
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 16px ${COLORS.primarySalmon}30;
  transition: all 0.25s ease;
  animation: ${glowPulse} 4s ease-in-out infinite;

  &:hover {
    animation: ${shimmer} 1.5s ease infinite;
    box-shadow: 0 4px 24px ${COLORS.primarySalmon}50,
      0 0 0 1px ${COLORS.primarySalmon}30;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 1px 8px ${COLORS.primarySalmon}30;
  }

  @media (max-width: 1199px) {
    padding: 11px;
    border-radius: 12px;
  }
`;

const CreateIconWrap = styled.span`
  font-size: 0.95rem;
  display: grid;
  place-items: center;
  width: 20px;
  flex-shrink: 0;
`;

const CreateLabel = styled.span`
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

// ── Avatar ───────────────────────────────────────────────────────────────────

const AvatarIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.border)};
  background: ${(p) =>
    p.$active
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}28, ${COLORS.primaryMint}28)`
      : `${COLORS.elevatedBackground}`};
  display: grid;
  place-items: center;
  font-size: 0.6rem;
  font-weight: 800;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  letter-spacing: 0.5px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  ${NavLink}:hover & {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
  }
`;

// ── Spacer ───────────────────────────────────────────────────────────────────

const Spacer = styled.div`
  flex: 1;
  min-height: 16px;
`;

// ── Section label ────────────────────────────────────────────────────────────

const SectionLabel = styled.div`
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: ${COLORS.textTertiary}88;
  padding: 8px 24px 4px;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

// ── Command palette hint ─────────────────────────────────────────────────────

const PaletteBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 10px 0;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid ${COLORS.border}60;
  background: ${COLORS.elevatedBackground}40;
  color: ${COLORS.textTertiary};
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    font-size: 0.7rem;
  }

  &:hover {
    border-color: ${COLORS.primaryMint}60;
    color: ${COLORS.primaryMint};
    background: ${COLORS.primaryMint}08;
    transform: translateY(-1px);
  }
`;

const PaletteBtnLabel = styled.span`
  display: none;
  font-weight: 500;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const KbdGroup = styled.span`
  display: none;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  @media (min-width: 1200px) {
    display: flex;
  }
`;

const Kbd = styled.kbd`
  font-family: inherit;
  font-size: 0.62rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  background: ${COLORS.background};
  border: 1px solid ${COLORS.border}80;
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.4;
`;
