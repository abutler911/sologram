import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import {
  FaHome,
  FaSearch,
  FaPlus,
  FaFolder,
  FaFolderOpen,
  FaUser,
  FaCamera,
  FaImages,
  FaLightbulb,
  FaRobot,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaArchive,
  FaShieldAlt,
  FaMagic,
  FaChevronRight,
  FaBars,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../theme';
import EasterEggModal from '../easter/EasterEggModal';

const AppNav = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const canCreate =
    isAuthenticated && (user?.role === 'admin' || user?.role === 'creator');

  // ── overlay state ──────────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputRef = useRef(null);

  // ── Easter egg — 4 clicks on logo within 5 seconds ────────────────────────
  const [easterOpen, setEasterOpen] = useState(false);
  const logoClickTimes = useRef([]);

  const handleLogoClick = (e) => {
    e.preventDefault(); // always block navigation so clicks don't reset the counter
    const now = Date.now();
    logoClickTimes.current = [
      ...logoClickTimes.current.filter((t) => now - t < 5000),
      now,
    ];
    if (logoClickTimes.current.length >= 4) {
      logoClickTimes.current = [];
      setEasterOpen(true);
    }
  };

  // ── Long press → A220 flyby ────────────────────────────────────────────────
  const [planeFlying, setPlaneFlying] = useState(false);
  const longPressTimer = useRef(null);

  const handleLogoPointerDown = (e) => {
    e.preventDefault();
    longPressTimer.current = setTimeout(() => {
      setPlaneFlying(true);
      setTimeout(() => setPlaneFlying(false), 3200);
    }, 600);
  };

  const handleLogoPointerUp = () => {
    clearTimeout(longPressTimer.current);
  };

  // ── sync URL search param → local state ───────────────────────────────────
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    setSearchQuery(q);
    if (location.pathname === '/' && q && onSearch) onSearch(q);
  }, [location, onSearch]);

  // ── close overlays on navigation ──────────────────────────────────────────
  useEffect(() => {
    setCreateOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // ── auto-focus search input ────────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen)
      requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [searchOpen]);

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setCreateOpen(false);
        setPaletteOpen(false);
        setEasterOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── helpers ────────────────────────────────────────────────────────────────
  const isActive = useCallback(
    (path) =>
      path === '/'
        ? location.pathname === '/' && !location.search.includes('search=')
        : location.pathname.startsWith(path),
    [location]
  );

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  const triggerSearch = (e) => {
    e?.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      onSearch?.(q);
      if (location.pathname !== '/')
        navigate(`/?search=${encodeURIComponent(q)}`);
    } else {
      onClearSearch?.();
    }
    setSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onClearSearch?.();
    searchInputRef.current?.focus();
  };

  const goCreate = (to) => {
    setCreateOpen(false);
    navigate(to);
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '?';

  const paletteItems = useMemo(() => {
    const base = [
      { label: 'Home', icon: <FaHome />, to: '/' },
      { label: 'Thoughts', icon: <FaLightbulb />, to: '/thoughts' },
      { label: 'Collections', icon: <FaFolder />, to: '/collections' },
      { label: 'Profile', icon: <FaUser />, to: '/profile' },
      { label: 'Story Archive', icon: <FaArchive />, to: '/story-archive' },
    ];
    if (canCreate)
      base.push(
        { label: 'New Post', icon: <FaCamera />, to: '/create' },
        { label: 'New Story', icon: <FaImages />, to: '/create-story' },
        { label: 'New Thought', icon: <FaLightbulb />, to: '/thoughts/create' },
        {
          label: 'New Collection',
          icon: <FaFolder />,
          to: '/collections/create',
        }
      );
    if (isAdmin)
      base.push(
        { label: 'Media Gallery', icon: <FaImages />, to: '/media-gallery' },
        { label: 'AI Content', icon: <FaRobot />, to: '/admin/ai-content' }
      );
    return base;
  }, [canCreate, isAdmin]);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  MOBILE TOP BAR                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TopBar>
        <TopBarInner>
          {/* onClick fires the hidden click counter — no visible change */}
          <Logo
            to='/'
            onClick={handleLogoClick}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
          >
            <LogoIcon>
              <FaCamera />
            </LogoIcon>
            <LogoText>SoloGram</LogoText>
          </Logo>

          <TopBarActions>
            {canCreate && (
              <TopBarIconLink
                to='/story-archive'
                $active={isActive('/story-archive')}
                title='Story Archive'
              >
                <FaArchive />
              </TopBarIconLink>
            )}
            {isAuthenticated ? (
              <AvatarButton
                onClick={() => navigate('/profile')}
                aria-label='Profile'
              >
                {initials}
              </AvatarButton>
            ) : (
              <TopBarIconLink to='/login' title='Sign in'>
                <FaSignInAlt />
              </TopBarIconLink>
            )}
          </TopBarActions>
        </TopBarInner>
      </TopBar>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  DESKTOP LEFT SIDEBAR                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Sidebar>
        <SideInner>
          {/* onClick fires the hidden click counter — no visible change */}
          <SideLogoLink
            to='/'
            onClick={handleLogoClick}
            onPointerDown={handleLogoPointerDown}
            onPointerUp={handleLogoPointerUp}
            onPointerLeave={handleLogoPointerUp}
          >
            <LogoIcon small>
              <FaCamera />
            </LogoIcon>
            <SideLogoText>SoloGram</SideLogoText>
          </SideLogoLink>

          <SideDivider />

          <SideNav>
            <SideNavLink to='/' $active={isActive('/')}>
              <SideIcon>
                <FaHome />
              </SideIcon>
              <SideLabel>Home</SideLabel>
            </SideNavLink>

            <SideNavButton onClick={() => setSearchOpen(true)}>
              <SideIcon>
                <FaSearch />
              </SideIcon>
              <SideLabel>Search</SideLabel>
            </SideNavButton>

            <SideNavLink to='/thoughts' $active={isActive('/thoughts')}>
              <SideIcon>
                <FaLightbulb />
              </SideIcon>
              <SideLabel>Thoughts</SideLabel>
            </SideNavLink>

            <SideNavLink to='/collections' $active={isActive('/collections')}>
              <SideIcon>
                {isActive('/collections') ? <FaFolderOpen /> : <FaFolder />}
              </SideIcon>
              <SideLabel>Collections</SideLabel>
            </SideNavLink>

            {canCreate && (
              <SideNavButton onClick={() => setCreateOpen(true)}>
                <SideIcon>
                  <FaPlus />
                </SideIcon>
                <SideLabel>Create</SideLabel>
              </SideNavButton>
            )}

            {canCreate && (
              <SideNavLink
                to='/story-archive'
                $active={isActive('/story-archive')}
              >
                <SideIcon>
                  <FaArchive />
                </SideIcon>
                <SideLabel>Story Archive</SideLabel>
              </SideNavLink>
            )}
          </SideNav>

          <SideSpacer />

          {isAdmin && (
            <>
              <SideSectionLabel>Admin</SideSectionLabel>
              <SideNav>
                <SideNavLink
                  to='/media-gallery'
                  $active={isActive('/media-gallery')}
                >
                  <SideIcon>
                    <FaImages />
                  </SideIcon>
                  <SideLabel>Media Gallery</SideLabel>
                </SideNavLink>
                <SideNavLink
                  to='/admin/ai-content'
                  $active={isActive('/admin/ai-content')}
                >
                  <SideIcon>
                    <FaRobot />
                  </SideIcon>
                  <SideLabel>AI Content</SideLabel>
                </SideNavLink>
              </SideNav>
              <SideDivider />
            </>
          )}

          <SideNav>
            {isAuthenticated ? (
              <>
                <SideNavLink to='/profile' $active={isActive('/profile')}>
                  <SideAvatar $active={isActive('/profile')}>
                    {initials}
                  </SideAvatar>
                  <SideLabel>{user?.username || 'Profile'}</SideLabel>
                </SideNavLink>
                <SideNavButton onClick={doLogout} $danger>
                  <SideIcon>
                    <FaSignOutAlt />
                  </SideIcon>
                  <SideLabel>Logout</SideLabel>
                </SideNavButton>
              </>
            ) : (
              <SideNavLink to='/login'>
                <SideIcon>
                  <FaSignInAlt />
                </SideIcon>
                <SideLabel>Sign In</SideLabel>
              </SideNavLink>
            )}
          </SideNav>

          <PaletteButton onClick={() => setPaletteOpen(true)}>
            <FaMagic />
            <PaletteButtonLabel>⌘K</PaletteButtonLabel>
          </PaletteButton>
        </SideInner>
      </Sidebar>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  MOBILE BOTTOM TAB BAR                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <BottomBar>
        <BottomBarInner>
          <BottomTab to='/' $active={isActive('/')}>
            <BottomIcon $active={isActive('/')}>
              <FaHome />
            </BottomIcon>
          </BottomTab>

          <BottomTabButton
            onClick={() => setSearchOpen(true)}
            $active={searchOpen}
          >
            <BottomIcon $active={searchOpen}>
              <FaSearch />
            </BottomIcon>
          </BottomTabButton>

          {canCreate ? (
            <BottomTabButton
              onClick={() => setCreateOpen(true)}
              aria-label='Create'
            >
              <CreateSquare>
                <FaPlus />
              </CreateSquare>
            </BottomTabButton>
          ) : (
            <BottomTab to='/login'>
              <BottomIcon>
                <FaSignInAlt />
              </BottomIcon>
            </BottomTab>
          )}

          <BottomTab to='/thoughts' $active={isActive('/thoughts')}>
            <BottomIcon $active={isActive('/thoughts')}>
              <FaLightbulb />
            </BottomIcon>
          </BottomTab>

          {isAdmin ? (
            <BottomTab
              to='/media-gallery'
              $active={isActive('/media-gallery') || isActive('/admin')}
            >
              <BottomIcon
                $active={isActive('/media-gallery') || isActive('/admin')}
              >
                <FaShieldAlt />
              </BottomIcon>
            </BottomTab>
          ) : isAuthenticated ? (
            <BottomTab to='/profile' $active={isActive('/profile')}>
              <BottomAvatarIcon $active={isActive('/profile')}>
                {initials}
              </BottomAvatarIcon>
            </BottomTab>
          ) : (
            <BottomTab to='/login'>
              <BottomIcon>
                <FaUser />
              </BottomIcon>
            </BottomTab>
          )}
        </BottomBarInner>
      </BottomBar>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  SEARCH OVERLAY                                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {searchOpen && (
        <SearchOverlay>
          <SearchCard>
            <SearchRow>
              <SearchBox>
                <FaSearch />
                <form
                  onSubmit={triggerSearch}
                  style={{ flex: 1, display: 'flex' }}
                >
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search posts and thoughts…'
                    autoComplete='off'
                  />
                </form>
                {searchQuery && (
                  <SearchClearBtn type='button' onClick={clearSearch}>
                    <FaTimes />
                  </SearchClearBtn>
                )}
              </SearchBox>
              <SearchCancelBtn
                onClick={() => {
                  setSearchOpen(false);
                  clearSearch();
                }}
              >
                Cancel
              </SearchCancelBtn>
            </SearchRow>
            <SearchBody>
              {searchQuery ? (
                <SearchActiveHint>
                  Press <kbd>↵</kbd> to search for &ldquo;{searchQuery}&rdquo;
                </SearchActiveHint>
              ) : (
                <SearchEmptyState>
                  <FaSearch />
                  <p>Search posts, thoughts, and more</p>
                  <SearchTip>⌘K opens command palette</SearchTip>
                </SearchEmptyState>
              )}
            </SearchBody>
          </SearchCard>
        </SearchOverlay>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  CREATE BOTTOM SHEET                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {createOpen && (
        <SheetBackdrop onClick={() => setCreateOpen(false)}>
          <CreateSheet onClick={(e) => e.stopPropagation()}>
            <SheetHandle />
            <SheetTitle>Create</SheetTitle>
            <CreateGrid>
              <CreateCard
                onClick={() => goCreate('/create')}
                $color={COLORS.primarySalmon}
              >
                <CreateCardIcon $color={COLORS.primarySalmon}>
                  <FaCamera />
                </CreateCardIcon>
                <CreateCardName>Post</CreateCardName>
                <CreateCardSub>Photo or video</CreateCardSub>
              </CreateCard>
              <CreateCard
                onClick={() => goCreate('/create-story')}
                $color={COLORS.primaryMint}
              >
                <CreateCardIcon $color={COLORS.primaryMint}>
                  <FaImages />
                </CreateCardIcon>
                <CreateCardName>Story</CreateCardName>
                <CreateCardSub>Gone in 24h</CreateCardSub>
              </CreateCard>
              <CreateCard
                onClick={() => goCreate('/thoughts/create')}
                $color={COLORS.primaryBlueGray}
              >
                <CreateCardIcon $color={COLORS.primaryBlueGray}>
                  <FaLightbulb />
                </CreateCardIcon>
                <CreateCardName>Thought</CreateCardName>
                <CreateCardSub>What's on your mind</CreateCardSub>
              </CreateCard>
              <CreateCard
                onClick={() => goCreate('/collections/create')}
                $color={COLORS.accentSalmon}
              >
                <CreateCardIcon $color={COLORS.accentSalmon}>
                  <FaFolderOpen />
                </CreateCardIcon>
                <CreateCardName>Collection</CreateCardName>
                <CreateCardSub>Group your posts</CreateCardSub>
              </CreateCard>
            </CreateGrid>
            <SheetDivider />
            <SheetTitle>Browse</SheetTitle>
            <BrowseList>
              <BrowseItem onClick={() => goCreate('/collections')}>
                <BrowseItemIcon $color={COLORS.accentSalmon}>
                  <FaFolderOpen />
                </BrowseItemIcon>
                <BrowseItemText>
                  <BrowseItemName>Collections</BrowseItemName>
                  <BrowseItemSub>Browse your curated groups</BrowseItemSub>
                </BrowseItemText>
              </BrowseItem>
              {canCreate && (
                <BrowseItem onClick={() => goCreate('/story-archive')}>
                  <BrowseItemIcon $color={COLORS.primaryBlueGray}>
                    <FaArchive />
                  </BrowseItemIcon>
                  <BrowseItemText>
                    <BrowseItemName>Story Archive</BrowseItemName>
                    <BrowseItemSub>Your past stories</BrowseItemSub>
                  </BrowseItemText>
                </BrowseItem>
              )}
            </BrowseList>
          </CreateSheet>
        </SheetBackdrop>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  COMMAND PALETTE                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {paletteOpen && (
        <CommandPalette
          items={paletteItems}
          onClose={() => setPaletteOpen(false)}
          navigate={navigate}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/*  EASTER EGG — 4× logo clicks in 5s → secret code modal              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {planeFlying && <PlaneFlightOverlay />}
      {easterOpen && <EasterEggModal onClose={() => setEasterOpen(false)} />}
    </>
  );
};

// ── Command Palette component ─────────────────────────────────────────────────
const CommandPalette = ({ items, onClose, navigate }) => {
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((i) => i.label.toLowerCase().includes(s)) : items;
  }, [q, items]);

  return (
    <PaletteBackdrop onClick={onClose}>
      <PalettePanel onClick={(e) => e.stopPropagation()}>
        <PaletteInputRow>
          <FaMagic />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Type a page or command…'
          />
          <PaletteKbd>Esc</PaletteKbd>
        </PaletteInputRow>
        <PaletteResults>
          {filtered.map((item, i) => (
            <PaletteRow
              key={i}
              onClick={() => {
                navigate(item.to);
                onClose();
              }}
            >
              <PaletteRowIcon>{item.icon}</PaletteRowIcon>
              <span>{item.label}</span>
              <PaletteChevron>
                <FaChevronRight />
              </PaletteChevron>
            </PaletteRow>
          ))}
          {!filtered.length && (
            <PaletteEmpty>No results for &ldquo;{q}&rdquo;</PaletteEmpty>
          )}
        </PaletteResults>
      </PalettePanel>
    </PaletteBackdrop>
  );
};

export default AppNav;

// ─────────────────────────────────────────────────────────────────────────────
// Keyframes
// ─────────────────────────────────────────────────────────────────────────────
const fadeIn = keyframes`from { opacity: 0 }              to { opacity: 1 }`;
const slideUp = keyframes`from { transform: translateY(100%) } to { transform: translateY(0) }`;
const popIn = keyframes`from { transform: scale(.95); opacity: 0 } to { transform: scale(1); opacity: 1 }`;
const dropDown = keyframes`from { transform: translateY(-8px); opacity: 0 } to { transform: translateY(0); opacity: 1 }`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────────────────────
const LogoIcon = styled.div`
  width: ${(p) => (p.small ? '28px' : '30px')};
  height: ${(p) => (p.small ? '28px' : '30px')};
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  font-size: ${(p) => (p.small ? '0.7rem' : '0.78rem')};
  flex-shrink: 0;
`;

const LogoText = styled.span`
  font-family: 'Mystery Quest', cursive;
  font-size: 1.3rem;
  color: ${COLORS.textPrimary};
  line-height: 1;
  letter-spacing: 0.3px;
`;

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────
const TopBar = styled.header`
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

const TopBarInner = styled.div`
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

const TopBarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TopBarIconLink = styled(Link)`
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

const AvatarButton = styled.button`
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

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP LEFT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_FULL = '240px';
const SIDEBAR_NARROW = '72px';

const Sidebar = styled.aside`
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

const SideInner = styled.div`
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

const SideDivider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 6px 12px;
`;

const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 8px;
`;

const sideItemBase = css`
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

const SideNavLink = styled(Link)`
  ${sideItemBase}
`;
const SideNavButton = styled.button`
  ${sideItemBase}
`;

const SideIcon = styled.span`
  font-size: 1.1rem;
  display: grid;
  place-items: center;
  width: 22px;
  flex-shrink: 0;
`;

const SideLabel = styled.span`
  white-space: nowrap;
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

const SideAvatar = styled.div`
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

const SideSpacer = styled.div`
  flex: 1;
  min-height: 12px;
`;

const SideSectionLabel = styled.div`
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

const PaletteButton = styled.button`
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

const PaletteButtonLabel = styled.span`
  display: none;
  @media (min-width: 1200px) {
    display: block;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE BOTTOM TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
const BottomBar = styled.nav`
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

const BottomBarInner = styled.div`
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
const BottomTab = styled(Link)`
  ${tabBase}
`;
const BottomTabButton = styled.button`
  ${tabBase}
`;

const BottomIcon = styled.span`
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

const BottomAvatarIcon = styled.div`
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
  ${BottomTabButton}:active & {
    transform: scale(0.91);
    box-shadow: 0 1px 6px ${COLORS.primarySalmon}30;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
const SearchOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: ${COLORS.background};
  display: flex;
  flex-direction: column;
  animation: ${fadeIn} 0.12s ease;
  @media (min-width: 960px) {
    background: rgba(0, 0, 0, 0.52);
    backdrop-filter: blur(5px);
    align-items: center;
    justify-content: flex-start;
    padding-top: 10vh;
  }
`;

const SearchCard = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  @media (min-width: 960px) {
    height: auto;
    max-width: 580px;
    background: ${COLORS.cardBackground};
    border: 1px solid ${COLORS.border};
    border-radius: 18px;
    overflow: hidden;
    animation: ${popIn} 0.16s ease;
  }
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.background};
  @media (min-width: 960px) {
    background: transparent;
  }
`;

const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 9px 12px;
  svg {
    color: ${COLORS.textTertiary};
    flex-shrink: 0;
  }
  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: ${COLORS.textPrimary};
    font-size: 0.97rem;
    width: 100%;
    &::placeholder {
      color: ${COLORS.textTertiary};
    }
  }
`;

const SearchClearBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 0.82rem;
  padding: 2px;
  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const SearchCancelBtn = styled.button`
  background: none;
  border: none;
  color: ${COLORS.primarySalmon};
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  padding: 4px 0;
  &:hover {
    opacity: 0.78;
  }
`;

const SearchBody = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
`;

const SearchEmptyState = styled.div`
  text-align: center;
  color: ${COLORS.textTertiary};
  svg {
    font-size: 2.2rem;
    opacity: 0.22;
    display: block;
    margin: 0 auto 14px;
  }
  p {
    margin: 0 0 6px;
    font-size: 0.95rem;
    color: ${COLORS.textSecondary};
  }
`;

const SearchTip = styled.div`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
`;

const SearchActiveHint = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.9rem;
  text-align: center;
  kbd {
    background: ${COLORS.elevatedBackground};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.8rem;
    margin-right: 4px;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// CREATE BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────────
const SheetBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.1s ease;
  display: flex;
  align-items: flex-end;
  @media (min-width: 960px) {
    align-items: center;
    justify-content: center;
  }
`;

const CreateSheet = styled.div`
  width: 100%;
  background: ${COLORS.cardBackground};
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  border: 1px solid ${COLORS.border};
  border-bottom: none;
  padding: 8px 16px calc(36px + env(safe-area-inset-bottom));
  animation: ${slideUp} 0.22s cubic-bezier(0.34, 1.15, 0.64, 1);
  @media (min-width: 960px) {
    width: auto;
    min-width: 380px;
    max-width: 440px;
    border-radius: 20px;
    border: 1px solid ${COLORS.border};
    padding: 16px 18px 22px;
    animation: ${popIn} 0.18s ease;
  }
`;

const SheetHandle = styled.div`
  width: 34px;
  height: 4px;
  border-radius: 99px;
  background: ${COLORS.border};
  margin: 6px auto 16px;
  @media (min-width: 960px) {
    display: none;
  }
`;

const SheetTitle = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.1px;
  color: ${COLORS.textTertiary};
  margin: 0 0 12px;
`;

const CreateGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const CreateCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 15px 14px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.13s ease;
  &:hover {
    background: ${COLORS.buttonHover};
    border-color: ${(p) => p.$color}45;
    transform: translateY(-2px);
  }
  &:active {
    transform: scale(0.97);
  }
`;

const CreateCardIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: ${(p) => p.$color}1a;
  color: ${(p) => p.$color};
  font-size: 1.05rem;
  margin-bottom: 6px;
`;

const CreateCardName = styled.span`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
`;
const CreateCardSub = styled.span`
  font-size: 0.7rem;
  color: ${COLORS.textTertiary};
  line-height: 1.3;
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const PaletteBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 600;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 0;
  animation: ${fadeIn} 0.1s ease;
`;

const PalettePanel = styled.div`
  width: 100%;
  max-width: 580px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
  animation: ${dropDown} 0.15s ease;
`;

const PaletteInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid ${COLORS.border};
  svg {
    color: ${COLORS.primarySalmon};
    flex-shrink: 0;
  }
  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: ${COLORS.textPrimary};
    font-size: 1rem;
    &::placeholder {
      color: ${COLORS.textTertiary};
    }
  }
`;

const PaletteKbd = styled.kbd`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 5px;
  padding: 2px 7px;
`;

const PaletteResults = styled.div`
  max-height: 380px;
  overflow-y: auto;
  padding: 6px;
`;

const PaletteRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: none;
  background: none;
  color: ${COLORS.textPrimary};
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  transition: background 0.1s;
  &:hover {
    background: ${COLORS.elevatedBackground};
  }
`;

const PaletteRowIcon = styled.span`
  width: 20px;
  display: grid;
  place-items: center;
  color: ${COLORS.textSecondary};
  font-size: 0.95rem;
  flex-shrink: 0;
  ${PaletteRow}:hover & {
    color: ${COLORS.primarySalmon};
  }
`;

const PaletteChevron = styled.span`
  margin-left: auto;
  color: ${COLORS.textTertiary};
  font-size: 0.65rem;
  opacity: 0;
  transition: opacity 0.1s;
  ${PaletteRow}:hover & {
    opacity: 1;
  }
`;

const PaletteEmpty = styled.div`
  padding: 24px;
  text-align: center;
  color: ${COLORS.textTertiary};
  font-size: 0.88rem;
`;

const SheetDivider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 14px 0 10px;
`;

const BrowseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BrowseItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;
  &:hover {
    background: ${COLORS.elevatedBackground};
  }
  &:active {
    background: ${COLORS.buttonHover};
  }
`;

const BrowseItemIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  font-size: 0.95rem;
  flex-shrink: 0;
`;

const BrowseItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;
const BrowseItemName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;
const BrowseItemSub = styled.span`
  font-size: 0.72rem;
  color: ${COLORS.textTertiary};
`;

// ─────────────────────────────────────────────────────────────────────────────
// A220 FLYBY
// ─────────────────────────────────────────────────────────────────────────────

const flyAcross = keyframes`
  0%   { transform: translateX(-120px) translateY(0px)   scaleX(1); opacity: 0; }
  5%   { opacity: 1; }
  30%  { transform: translateX(30vw)   translateY(-40px) scaleX(1); }
  60%  { transform: translateX(65vw)   translateY(-18px) scaleX(1); }
  90%  { transform: translateX(105vw)  translateY(-50px) scaleX(1); opacity: 1; }
  100% { transform: translateX(110vw)  translateY(-55px) scaleX(1); opacity: 0; }
`;

const contrailFade = keyframes`
  0%   { opacity: 0.55; width: 0px; }
  20%  { opacity: 0.4;  width: 80px; }
  80%  { opacity: 0.15; width: 160px; }
  100% { opacity: 0;    width: 200px; }
`;

const PlaneFlightOverlay = () => (
  <PlaneStage>
    <PlaneRig>
      {/* twin contrail lines */}
      <Contrail $top='10px' />
      <Contrail $top='16px' $delay='0.08s' />
      {/* the plane — Airbus A220 silhouette via emoji + label */}
      <PlaneSvg viewBox='0 0 64 32' xmlns='http://www.w3.org/2000/svg'>
        {/* fuselage */}
        <ellipse cx='32' cy='16' rx='28' ry='5' fill='#e8e4dd' />
        {/* nose cone */}
        <path d='M60 16 Q68 14 70 16 Q68 18 60 16Z' fill='#c8c4bc' />
        {/* tail fin */}
        <path d='M6 16 Q4 6 10 8 L14 16Z' fill='#e8e4dd' />
        {/* horizontal stabilisers */}
        <path d='M8 16 Q6 22 12 21 L14 16Z' fill='#d4d0c8' />
        <path d='M8 16 Q6 10 12 11 L14 16Z' fill='#d4d0c8' />
        {/* main wing */}
        <path d='M28 16 Q30 4 44 6 L44 16Z' fill='#dedad2' />
        <path d='M28 16 Q30 28 44 26 L44 16Z' fill='#d0ccc4' />
        {/* engine pods */}
        <ellipse cx='40' cy='10' rx='5' ry='2.5' fill='#b8b4ac' />
        <ellipse cx='40' cy='22' rx='5' ry='2.5' fill='#b8b4ac' />
        {/* windows strip */}
        <rect
          x='20'
          y='13.5'
          width='34'
          height='2'
          rx='1'
          fill='rgba(100,160,220,0.5)'
        />
        {/* airline stripe — salmon nod to the app */}
        <rect
          x='4'
          y='14.5'
          width='56'
          height='1.5'
          rx='0.75'
          fill='#e87c5a'
          opacity='0.7'
        />
      </PlaneSvg>
      <PlaneLabel>A220</PlaneLabel>
    </PlaneRig>
  </PlaneStage>
);

const PlaneStage = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
`;

const PlaneRig = styled.div`
  position: absolute;
  top: 28%;
  left: 0;
  display: flex;
  align-items: center;
  gap: 0;
  animation: ${flyAcross} 3.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.18));
`;

const Contrail = styled.div`
  position: absolute;
  right: 100%;
  top: ${(p) => p.$top || '12px'};
  height: 1.5px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6));
  border-radius: 1px;
  animation: ${contrailFade} 3.2s ease forwards;
  animation-delay: ${(p) => p.$delay || '0s'};
`;

const PlaneSvg = styled.svg`
  width: 96px;
  height: 48px;
`;

const PlaneLabel = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 6px;
  white-space: nowrap;
`;
