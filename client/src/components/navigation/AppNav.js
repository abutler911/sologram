import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  FaCamera,
  FaChevronDown,
  FaFolder,
  FaHome,
  FaImages,
  FaLightbulb,
  FaRobot,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaArchive,
  FaPlus,
  FaMagic,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../theme";

/**
 * AppNav.jsx — Unified Navigation (Desktop + Mobile)
 *
 * - Top App Bar (desktop & tablet): logo, primary nav, create dropdown, search, user menu
 * - Mobile Bottom Tab Bar + center Create FAB + "More" sheet
 * - Role aware: `admin` gets AI + Gallery; `creator|admin` get Create actions
 * - Command Palette (⌘K / Ctrl+K)
 * - Search overlay that syncs with /?search= query param
 */

const AppNav = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const canCreate =
    isAuthenticated && (user?.role === "admin" || user?.role === "creator");

  // UI state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false); // mobile sheet
  const [paletteOpen, setPaletteOpen] = useState(false);

  const searchInputRef = useRef(null);
  const createRef = useRef(null);
  const userRef = useRef(null);

  // Sync search query with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("search") || "";
    setSearchQuery(q);
    if (location.pathname === "/" && q && onSearch) onSearch(q);
  }, [location, onSearch]);

  // Close menus on route change
  useEffect(() => {
    setCreateOpen(false);
    setUserOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  // Focus when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);

  // Click outside handlers
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        createOpen &&
        createRef.current &&
        !createRef.current.contains(e.target)
      ) {
        setCreateOpen(false);
      }
      if (userOpen && userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [createOpen, userOpen]);

  // Command palette hotkey
  useEffect(() => {
    const onKey = (e) => {
      const mod = navigator.platform.includes("Mac") ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setPaletteOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = useCallback(
    (path) =>
      path === "/"
        ? location.pathname === "/" && !location.search.includes("search")
        : location.pathname.startsWith(path),
    [location.pathname, location.search]
  );

  // ---- Actions & Handlers ----
  const doLogout = () => {
    logout();
    setUserOpen(false);
    navigate("/login");
  };

  const triggerSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      onSearch && onSearch(searchQuery);
      if (location.pathname !== "/")
        navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    } else {
      setSearchOpen(false);
      onClearSearch && onClearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onClearSearch && onClearSearch();
    searchInputRef.current?.focus();
  };

  // Command palette items
  const paletteItems = useMemo(() => {
    const items = [
      { label: "Home", icon: <FaHome />, to: "/" },
      { label: "Thoughts", icon: <FaLightbulb />, to: "/thoughts" },
      { label: "Collections", icon: <FaFolder />, to: "/collections" },
    ];
    if (isAdmin)
      items.push({
        label: "Gallery",
        icon: <FaImages />,
        to: "/media-gallery",
      });
    if (canCreate) {
      items.push(
        { label: "New Post", icon: <FaCamera />, to: "/create" },
        { label: "New Story", icon: <FaImages />, to: "/create-story" },
        { label: "New Thought", icon: <FaLightbulb />, to: "/thoughts/create" },
        {
          label: "New Collection",
          icon: <FaFolder />,
          to: "/collections/create",
        },
        { label: "Story Archive", icon: <FaArchive />, to: "/story-archive" }
      );
    }
    if (isAdmin)
      items.push({
        label: "AI Content",
        icon: <FaRobot />,
        to: "/admin/ai-content",
      });
    items.push({ label: "Profile", icon: <FaUser />, to: "/profile" });
    return items;
  }, [isAdmin, canCreate]);

  // ---- Render ----
  return (
    <>
      {/* Top App Bar */}
      <AppBar>
        <BarInner>
          <Logo to="/">
            <span className="mark">
              <FaCamera />
            </span>
            <span className="brand">
              <span className="word">SoloGram</span>
              <span className="tagline">One Voice. Infinite Moments.</span>
            </span>
          </Logo>

          {/* Desktop primary nav */}
          <PrimaryNav>
            <NavLinkEl to="/" $active={isActive("/")}>
              <FaHome />
              <span>Home</span>
            </NavLinkEl>
            <NavLinkEl to="/thoughts" $active={isActive("/thoughts")}>
              <FaLightbulb />
              <span>Thoughts</span>
            </NavLinkEl>
            <NavLinkEl to="/collections" $active={isActive("/collections")}>
              <FaFolder />
              <span>Collections</span>
            </NavLinkEl>
            {isAdmin && (
              <NavLinkEl
                to="/media-gallery"
                $active={isActive("/media-gallery")}
              >
                <FaImages />
                <span>Gallery</span>
              </NavLinkEl>
            )}
            {isAdmin && (
              <NavLinkEl
                to="/admin/ai-content"
                $active={isActive("/admin/ai-content")}
              >
                <FaRobot />
                <span>AI</span>
              </NavLinkEl>
            )}
          </PrimaryNav>

          {/* Right actions */}
          <RightCluster>
            {/* Create dropdown */}
            {canCreate && (
              <CreateWrap ref={createRef}>
                <CreateBtn
                  onClick={() => setCreateOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={createOpen}
                >
                  <FaPlus /> <span>Create</span>{" "}
                  <FaChevronDown className="chev" />
                </CreateBtn>
                {createOpen && (
                  <Dropdown role="menu">
                    <DropItem
                      as={Link}
                      to="/create"
                      onClick={() => setCreateOpen(false)}
                    >
                      <FaCamera /> New Post
                    </DropItem>
                    <DropItem
                      as={Link}
                      to="/create-story"
                      onClick={() => setCreateOpen(false)}
                    >
                      <FaImages /> New Story
                    </DropItem>
                    <DropItem
                      as={Link}
                      to="/thoughts/create"
                      onClick={() => setCreateOpen(false)}
                    >
                      <FaLightbulb /> New Thought
                    </DropItem>
                    <DropItem
                      as={Link}
                      to="/collections/create"
                      onClick={() => setCreateOpen(false)}
                    >
                      <FaFolder /> New Collection
                    </DropItem>
                    <Divider />
                    <DropItem
                      as={Link}
                      to="/story-archive"
                      onClick={() => setCreateOpen(false)}
                    >
                      <FaArchive /> Story Archive
                    </DropItem>
                  </Dropdown>
                )}
              </CreateWrap>
            )}

            {/* Search */}
            <IconBtn aria-label="Search" onClick={() => setSearchOpen(true)}>
              <FaSearch />
            </IconBtn>

            {/* User menu */}
            {isAuthenticated ? (
              <UserWrap ref={userRef}>
                <AvatarBtn
                  onClick={() => setUserOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                >
                  <FaUser />
                </AvatarBtn>
                {userOpen && (
                  <Dropdown right role="menu">
                    <UserCard>
                      <strong>{user?.username}</strong>
                      <small>
                        {user?.role === "admin"
                          ? "Admin"
                          : user?.role || "User"}
                      </small>
                    </UserCard>
                    <Divider />
                    <DropItem
                      as={Link}
                      to="/profile"
                      onClick={() => setUserOpen(false)}
                    >
                      <FaUser /> Profile
                    </DropItem>
                    {canCreate && (
                      <>
                        <DropItem
                          as={Link}
                          to="/story-archive"
                          onClick={() => setUserOpen(false)}
                        >
                          <FaArchive /> Story Archive
                        </DropItem>
                      </>
                    )}
                    {isAdmin && (
                      <DropItem
                        as={Link}
                        to="/admin/ai-content"
                        onClick={() => setUserOpen(false)}
                      >
                        <FaRobot /> AI Content
                      </DropItem>
                    )}
                    <Divider />
                    <DropItem as="button" onClick={doLogout}>
                      <FaSignOutAlt /> Logout
                    </DropItem>
                  </Dropdown>
                )}
              </UserWrap>
            ) : (
              <IconLink to="/login" title="Login">
                <FaSignInAlt />
              </IconLink>
            )}
          </RightCluster>
        </BarInner>
      </AppBar>

      {/* Search overlay */}
      {searchOpen && (
        <SearchOverlay onClick={() => setSearchOpen(false)}>
          <SearchCard onClick={(e) => e.stopPropagation()}>
            <form onSubmit={triggerSearch}>
              <SearchRow>
                <FaSearch />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts and thoughts…"
                  aria-label="Search"
                />
                {searchQuery && (
                  <ClearBtn
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </ClearBtn>
                )}
              </SearchRow>
              <Tip>
                Press Enter to search • Press Esc to close • ⌘/Ctrl+K for
                Command Palette
              </Tip>
            </form>
          </SearchCard>
        </SearchOverlay>
      )}

      {/* Command palette */}
      {paletteOpen && (
        <Palette onClose={() => setPaletteOpen(false)} items={paletteItems} />
      )}

      {/* Mobile bottom bar + FAB */}
      <BottomDock>
        <DockLink to="/" $active={isActive("/")} aria-label="Home">
          <FaHome />
          <span>Home</span>
        </DockLink>
        <DockLink
          to="/thoughts"
          $active={isActive("/thoughts")}
          aria-label="Thoughts"
        >
          <FaLightbulb />
          <span>Thoughts</span>
        </DockLink>
        <FabShell>
          {canCreate ? (
            <Fab onClick={() => setMoreOpen(true)} aria-label="Create or more">
              <FaPlus />
            </Fab>
          ) : (
            <Fab as={Link} to="/login" aria-label="Login">
              <FaSignInAlt />
            </Fab>
          )}
        </FabShell>
        <DockLink
          to="/collections"
          $active={isActive("/collections")}
          aria-label="Collections"
        >
          <FaFolder />
          <span>Collections</span>
        </DockLink>
        <DockLink
          to="/profile"
          $active={isActive("/profile")}
          aria-label="Profile"
        >
          <FaUser />
          <span>Profile</span>
        </DockLink>
      </BottomDock>

      {/* Mobile More / Create sheet */}
      {moreOpen && (
        <Sheet onClose={() => setMoreOpen(false)}>
          {canCreate && (
            <>
              <SheetTitle>Create</SheetTitle>
              <SheetGrid>
                <SheetItem
                  as={Link}
                  to="/create"
                  onClick={() => setMoreOpen(false)}
                >
                  <FaCamera />
                  Post
                </SheetItem>
                <SheetItem
                  as={Link}
                  to="/create-story"
                  onClick={() => setMoreOpen(false)}
                >
                  <FaImages />
                  Story
                </SheetItem>
                <SheetItem
                  as={Link}
                  to="/thoughts/create"
                  onClick={() => setMoreOpen(false)}
                >
                  <FaLightbulb />
                  Thought
                </SheetItem>
                <SheetItem
                  as={Link}
                  to="/collections/create"
                  onClick={() => setMoreOpen(false)}
                >
                  <FaFolder />
                  Collection
                </SheetItem>
              </SheetGrid>
              <Divider style={{ marginTop: 8 }} />
            </>
          )}

          <SheetTitle>Navigate</SheetTitle>
          <SheetList>
            <li>
              <Link to="/" onClick={() => setMoreOpen(false)}>
                <FaHome /> Home
              </Link>
            </li>
            <li>
              <Link to="/story-archive" onClick={() => setMoreOpen(false)}>
                <FaArchive /> Story Archive
              </Link>
            </li>
            {isAdmin && (
              <>
                <li>
                  <Link to="/media-gallery" onClick={() => setMoreOpen(false)}>
                    <FaImages /> Gallery
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/ai-content"
                    onClick={() => setMoreOpen(false)}
                  >
                    <FaRobot /> AI Content
                  </Link>
                </li>
              </>
            )}
          </SheetList>
        </Sheet>
      )}
    </>
  );
};

export default AppNav;

/* ============================= Styles ============================= */

const AppBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  background: linear-gradient(
    180deg,
    ${COLORS.cardBackground}dd 0%,
    ${COLORS.cardBackground} 65%
  );
  border-bottom: 1px solid ${COLORS.border};
`;

const BarInner = styled.div`
  height: 64px;
  min-height: 68px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  .mark {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon},
      ${COLORS.accentSalmon}
    );
    color: white;
  }
  .brand {
    display: flex;
    flex-direction: column;
  }
  .word {
    font-family: "Mystery Quest", cursive;
    color: ${COLORS.textPrimary};
    font-size: 1.6rem;
    line-height: 1.05;
    letter-spacing: 0.2px;
  }
  .tagline {
    font-family: "Inter", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    color: ${COLORS.primaryMint};
    margin-top: 2px;
    opacity: 0.95;
    display: none;
  }
  @media (min-width: 960px) {
    .tagline {
      display: block;
    }
  }
`;

const PrimaryNav = styled.nav`
  display: none;
  align-items: center;
  gap: 4px;
  @media (min-width: 960px) {
    display: flex;
  }
`;

const NavLinkEl = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textSecondary)};
  background: ${(p) =>
    p.$active ? `${COLORS.primarySalmon}15` : "transparent"};
  border: 1px solid
    ${(p) => (p.$active ? `${COLORS.primarySalmon}40` : "transparent")};
  transition: all 0.2s ease;
  &:hover {
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}10;
  }
  svg {
    opacity: 0.9;
  }
`;

const RightCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  display: grid;
  place-items: center;
  background: ${COLORS.cardBackground};
  color: ${COLORS.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    color: ${COLORS.primarySalmon};
    border-color: ${COLORS.primarySalmon}55;
  }
`;

const IconLink = styled(Link)`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  display: grid;
  place-items: center;
  background: ${COLORS.cardBackground};
  color: ${COLORS.textSecondary};
  &:hover {
    color: ${COLORS.primarySalmon};
    border-color: ${COLORS.primarySalmon}55;
  }
`;

const CreateWrap = styled.div`
  position: relative;
`;

const CreateBtn = styled.button`
  height: 40px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid ${COLORS.border};
  background: linear-gradient(
    135deg,
    ${COLORS.primaryMint}15,
    ${COLORS.primaryBlueGray}10
  );
  color: ${COLORS.textPrimary};
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  .chev {
    opacity: 0.6;
  }
  &:hover {
    border-color: ${COLORS.primaryMint};
    box-shadow: 0 2px 10px ${COLORS.primaryMint}25;
  }
`;

const UserWrap = styled.div`
  position: relative;
`;

const AvatarBtn = styled(IconBtn)`
  display: inline-grid;
  place-items: center;
`;

const Dropdown = styled.div`
  position: absolute;
  ${(p) => (p.right ? "right: 0;" : "left: 0;")};
  top: 48px;
  min-width: 220px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  padding: 6px;
  z-index: 1000;
`;

const DropItem = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${COLORS.textPrimary};
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
  &:hover {
    background: ${COLORS.buttonHover};
  }
  svg {
    opacity: 0.9;
  }
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${COLORS.border};
  margin: 6px 4px;
`;

const UserCard = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong {
    color: ${COLORS.textPrimary};
  }
  small {
    color: ${COLORS.textTertiary};
  }
`;

/* Search */
const fadeIn = keyframes`from{opacity:0} to{opacity:1}`;
const SearchOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1200;
  animation: ${fadeIn} 0.12s ease;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  padding-left: 12px;
  padding-right: 12px;
`;
const SearchCard = styled.div`
  width: 100%;
  max-width: 720px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
`;
const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  padding: 10px 12px;
  background: ${COLORS.elevatedBackground};
  input {
    flex: 1;
    border: none;
    background: transparent;
    color: ${COLORS.textPrimary};
    font-size: 1rem;
    outline: none;
  }
  svg {
    color: ${COLORS.textSecondary};
  }
`;
const Tip = styled.div`
  color: ${COLORS.textTertiary};
  font-size: 0.8rem;
  padding-top: 8px;
  text-align: center;
`;
const ClearBtn = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: transparent;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  &:hover {
    color: ${COLORS.textPrimary};
    background: ${COLORS.buttonHover};
  }
`;

/* Mobile bottom dock */
const rise = keyframes`from{transform:translateY(16px); opacity:0} to{transform:translateY(0); opacity:1}`;
const BottomDock = styled.nav`
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: min(100%, var(--app-max-width, 470px)); /* same max as main */
  height: 72px;
  z-index: 1000;

  display: none;
  background: linear-gradient(
    180deg,
    ${COLORS.cardBackground}e6,
    ${COLORS.cardBackground}
  );
  backdrop-filter: blur(16px);
  border-top: 1px solid ${COLORS.border};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;

  /* safe-area breathing room on iOS */
  padding-left: max(8px, env(safe-area-inset-left));
  padding-right: max(8px, env(safe-area-inset-right));
  padding-bottom: env(safe-area-inset-bottom);

  @media (max-width: 959px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
`;

const DockLink = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  font-size: 0.68rem;
  font-weight: 600;
  padding: 8px;
  border-radius: 10px;
  min-width: 62px;
  &:hover {
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}10;
  }
  svg {
    font-size: 1.2rem;
  }
`;
const FabShell = styled.div`
  position: relative;
  top: -22px;
  animation: ${rise} 0.18s ease;
`;
const Fab = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 8px 24px ${COLORS.primarySalmon}40;
  font-size: 1.2rem;
  color: #fff;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
`;

/* Mobile Sheet */
const SheetOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(1px);
  z-index: 1200;
  animation: ${fadeIn} 0.12s ease;
`;
const slideUp = keyframes`from{transform:translateY(24px)} to{transform:translateY(0)}`;
const SheetPanel = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${COLORS.cardBackground};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border: 1px solid ${COLORS.border};
  padding: 10px 12px 22px;
  z-index: 1201;
  animation: ${slideUp} 0.16s ease;
`;
const Grabber = styled.div`
  width: 38px;
  height: 4px;
  border-radius: 999px;
  background: ${COLORS.border};
  margin: 6px auto 12px;
`;
const SheetTitle = styled.div`
  color: ${COLORS.textSecondary};
  font-weight: 700;
  font-size: 0.9rem;
  margin: 4px 6px 8px;
`;
const SheetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 4px 8px;
  @media (max-width: 420px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;
const SheetItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  padding: 14px 8px;
  border: 1px dashed ${COLORS.border};
  border-radius: 12px;
  color: ${COLORS.textPrimary};
  background: ${COLORS.elevatedBackground};
  font-weight: 600;
  &:hover {
    border-color: ${COLORS.primaryMint};
    background: ${COLORS.primaryMint}10;
  }
  svg {
    font-size: 1.2rem;
    opacity: 0.9;
  }
`;
const SheetList = styled.ul`
  list-style: none;
  padding: 4px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  li a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    text-decoration: none;
    color: ${COLORS.textPrimary};
  }
  li a:hover {
    background: ${COLORS.buttonHover};
  }
`;

/* Simple Sheet + Palette components */
const Sheet = ({ children, onClose }) => {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  return (
    <SheetOverlay onClick={onClose}>
      <SheetPanel onClick={(e) => e.stopPropagation()}>
        <Grabber />
        {children}
      </SheetPanel>
    </SheetOverlay>
  );
};

const PaletteWrap = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1300;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
`;
const PaletteCard = styled.div`
  width: 100%;
  max-width: 680px;
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
`;
const PaletteSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid ${COLORS.border};
  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: ${COLORS.textPrimary};
    font-size: 1rem;
  }
`;
const PaletteList = styled.div`
  max-height: 420px;
  overflow: auto;
  padding: 6px;
`;
const PaletteItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: ${COLORS.textPrimary};
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-weight: 600;
  &:hover {
    background: ${COLORS.buttonHover};
  }
`;

const Palette = ({ onClose, items }) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => i.label.toLowerCase().includes(s));
  }, [q, items]);
  return (
    <PaletteWrap onClick={onClose}>
      <PaletteCard onClick={(e) => e.stopPropagation()}>
        <PaletteSearch>
          <FaMagic style={{ color: COLORS.textSecondary }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command or destination…"
          />
          <kbd style={{ color: COLORS.textTertiary, fontSize: ".8rem" }}>
            Esc
          </kbd>
        </PaletteSearch>
        <PaletteList>
          {filtered.map((it, idx) => (
            <PaletteItem
              key={idx}
              onClick={() => {
                navigate(it.to);
                onClose();
              }}
            >
              {it.icon} <span>{it.label}</span>
            </PaletteItem>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 12, color: COLORS.textTertiary }}>
              No results
            </div>
          )}
        </PaletteList>
      </PaletteCard>
    </PaletteWrap>
  );
};
