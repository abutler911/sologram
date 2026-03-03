// navigation/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled, { css } from 'styled-components';
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

const SIDEBAR_FULL = '240px';
const SIDEBAR_NARROW = '72px';

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
      <SideLogoLink to='/' {...logoEasterEgg}>
        <NarrowMark>S</NarrowMark>
        <LogoWrap>
          <SideLogoText>SoloGram</SideLogoText>
          <SideTagline>One Voice. Infinite Moments.</SideTagline>
        </LogoWrap>
      </SideLogoLink>
      <Divider />

      {/* Primary nav */}
      <Nav>
        <NavLink to='/' $active={isActive('/')}>
          <Icon>
            <FaHome />
          </Icon>
          <Label>Home</Label>
        </NavLink>
        <NavButton onClick={onSearchOpen}>
          <Icon>
            <FaSearch />
          </Icon>
          <Label>Search</Label>
        </NavButton>
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
          <NavButton onClick={onCreateOpen}>
            <Icon>
              <FaPlus />
            </Icon>
            <Label>Create</Label>
          </NavButton>
        )}
        {canCreate && (
          <NavLink to='/story-archive' $active={isActive('/story-archive')}>
            <Icon>
              <FaArchive />
            </Icon>
            <Label>Story Archive</Label>
          </NavLink>
        )}
      </Nav>
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

      {/* Profile + logout */}
      <Nav>
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

      {/* ⌘K shortcut hint */}
      <PaletteBtn onClick={onPaletteOpen}>
        <FaMagic />
        <PaletteBtnLabel>⌘K</PaletteBtnLabel>
      </PaletteBtn>
    </Inner>
  </Wrapper>
);

export default Sidebar;

// ── Styled Components ────────────────────────────────────────────────────────

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
    background: ${COLORS.background};
    border-right: 1px solid ${COLORS.border};
  }
  @media (min-width: 1200px) {
    width: ${SIDEBAR_FULL};
  }
`;

const Inner = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 10px 0 20px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NarrowMark = styled.span`
  font-family: 'Autography', cursive;
  font-size: 2rem;
  line-height: 1.3;
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

const SideLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  margin: 0 8px 4px;
  padding: 10px;
  border-radius: 12px;
  height: 48px;
  transition: background 0.15s;
  justify-content: center;
  &:hover {
    background: ${COLORS.elevatedBackground};
  }
  @media (min-width: 1200px) {
    justify-content: flex-start;
  }
`;

const SideLogoText = styled(LogoText)`
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const LogoWrap = styled.div`
  display: none;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  @media (min-width: 1200px) {
    display: flex;
  }
`;

const SideTagline = styled.span`
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 0.55rem;
  letter-spacing: 0.02em;
  color: ${COLORS.textTertiary};
  opacity: 0.45;
  line-height: 1;
  white-space: nowrap;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 6px 12px;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
`;

const itemBase = css`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
  position: relative;
  transition: background 0.12s, color 0.12s;
  justify-content: center;
  background: ${(p) =>
    p.$active ? `${COLORS.primarySalmon}12` : 'transparent'};
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textSecondary)};
  ${(p) =>
    p.$active &&
    css`
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 52%;
        background: ${COLORS.primarySalmon};
        border-radius: 0 3px 3px 0;
      }
    `}
  &:hover {
    background: ${(p) =>
      p.$active ? `${COLORS.primarySalmon}1a` : COLORS.elevatedBackground};
    color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textPrimary)};
  }
  ${(p) =>
    p.$danger &&
    css`
      color: ${COLORS.textTertiary};
      &:hover {
        color: ${COLORS.error};
        background: ${COLORS.error}12;
      }
    `}
  @media (min-width: 1200px) {
    justify-content: flex-start;
    padding: 11px 12px;
    &::before {
      display: block;
    }
  }
`;

const NavLink = styled(Link)`
  ${itemBase}
`;
const NavButton = styled.button`
  ${itemBase}
`;

const Icon = styled.span`
  font-size: 1.1rem;
  display: grid;
  place-items: center;
  width: 22px;
  flex-shrink: 0;
`;

const Label = styled.span`
  white-space: nowrap;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const AvatarIcon = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid
    ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  background: ${(p) =>
    p.$active
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}28, ${COLORS.primaryMint}28)`
      : 'transparent'};
  display: grid;
  place-items: center;
  font-size: 0.58rem;
  font-weight: 800;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  letter-spacing: 0.5px;
  flex-shrink: 0;
  transition: border-color 0.15s, color 0.15s;
`;

const Spacer = styled.div`
  flex: 1;
  min-height: 12px;
`;

const SectionLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: ${COLORS.textTertiary};
  padding: 6px 20px 2px;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const PaletteBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 10px 8px 0;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px dashed ${COLORS.border};
  background: transparent;
  color: ${COLORS.textTertiary};
  font-size: 0.72rem;
  cursor: pointer;
  transition: all 0.15s;
  &:hover {
    border-color: ${COLORS.primaryMint};
    color: ${COLORS.primaryMint};
    background: ${COLORS.primaryMint}0a;
  }
`;

const PaletteBtnLabel = styled.span`
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;
