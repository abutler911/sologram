import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaCamera,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaExternalLinkAlt,
  FaTimes,
  FaFolder,
  FaArchive,
  FaSearch,
  FaChevronDown,
  FaBars,
  FaImage,
  FaPen,
  FaPlus,
  FaBookOpen,
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";
import { COLORS, THEME } from "../../theme";

const Header = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  // Refs for handling click outside
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);
  const createMenuRef = useRef(null);

  // Handle URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search") || "";
    setSearchQuery(query);
    if (location.pathname === "/" && query && onSearch) {
      onSearch(query);
    }
  }, [location, onSearch]);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Handle clicks outside menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchExpanded &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        handleCloseSearch();
      }

      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }

      if (
        createMenuOpen &&
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target)
      ) {
        setCreateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchExpanded, userMenuOpen, createMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchExpanded(false);
  }, [location.pathname]);

  // Auth and Navigation Handlers
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  const handleMenuItemClick = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setCreateMenuOpen(false);
  };

  // Search Handlers
  const handleOpenSearch = () => setSearchExpanded(true);

  const handleCloseSearch = () => {
    setSearchExpanded(false);
    if (searchQuery.trim() === "") {
      onClearSearch && onClearSearch();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch && onSearch(searchQuery);
      if (location.pathname !== "/") {
        navigate("/?search=" + encodeURIComponent(searchQuery));
      }
      if (window.innerWidth <= 768) handleCloseSearch();
    } else {
      handleCloseSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onClearSearch && onClearSearch();
    searchInputRef.current.focus();
  };

  // Navigation Items Configuration
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/collections", label: "Collections" },
    { path: "/thoughts", label: "Thoughts" },
    ...(isAuthenticated ? [{ path: "/story-archive", label: "Stories" }] : []),
    ...(isAdmin ? [{ path: "/media-gallery", label: "Media Gallery" }] : []),
  ];

  // External links kept separate for mobile menu placement
  const externalLinks = [
    {
      external: true,
      path: "https://solounderground.com",
      label: "SoloUnderground",
    },
  ];

  const userMenuItems = [
    ...(isAdmin
      ? [
          { path: "/thoughts/create", label: "New Thought", icon: <FaPen /> },
          { path: "/media-gallery", label: "Media Gallery", icon: <FaImage /> },
        ]
      : []),
    { path: "/collections", label: "Collections", icon: <FaFolder /> },
    { path: "/story-archive", label: "Story Archive", icon: <FaArchive /> },
    { path: "/profile", label: "Profile", icon: <FaUser /> },
  ];

  // Check if path is active
  const isPathActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const showSearchContainer = location.pathname === "/";

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <HeaderContent searchExpanded={searchExpanded}>
          {/* Logo */}
          <LogoContainer searchExpanded={searchExpanded}>
            <Logo to="/">
              <div className="logo-main">
                <FaCamera />
                <span className="logo-text">SoloGram</span>
              </div>
              <div className="tagline">One Voice. Infinite Moments.</div>
            </Logo>
          </LogoContainer>

          {/* Desktop Navigation */}
          <DesktopNavigation>
            {navItems.map((item) =>
              item.external ? (
                <NavLink
                  key={item.path}
                  as="a"
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </NavLink>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  active={isPathActive(item.path) ? "true" : undefined}
                >
                  {item.label}
                </NavLink>
              )
            )}
          </DesktopNavigation>

          {/* Header Actions (Right Side) */}
          <HeaderActions>
            {/* Search */}
            {showSearchContainer && (
              <SearchContainer
                ref={searchContainerRef}
                expanded={searchExpanded}
              >
                {!searchExpanded ? (
                  <ActionButton
                    onClick={handleOpenSearch}
                    aria-label="Open search"
                  >
                    <FaSearch />
                  </ActionButton>
                ) : (
                  <SearchForm onSubmit={handleSearchSubmit}>
                    <SearchInput
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <ClearButton
                        onClick={clearSearch}
                        aria-label="Clear search"
                        type="button"
                      >
                        <FaTimes />
                      </ClearButton>
                    )}
                    <SearchSubmit type="submit">
                      <FaSearch />
                    </SearchSubmit>
                    <CloseSearchButton
                      onClick={handleCloseSearch}
                      aria-label="Close search"
                      type="button"
                    >
                      <FaTimes />
                    </CloseSearchButton>
                  </SearchForm>
                )}
              </SearchContainer>
            )}

            {/* Create Menu for Desktop */}
            {isAuthenticated && !searchExpanded && (
              <CreateMenuContainer ref={userMenuRef}>
                <CreateMenuButton
                  onClick={() => setCreateMenuOpen(!createMenuOpen)}
                >
                  <FaPlus />
                  <span>Create</span>
                  <FaChevronDown className="arrow-icon" />
                </CreateMenuButton>
                {createMenuOpen && (
                  <CreateMenuDropdown>
                    <CreateMenuItem to="/create" onClick={handleMenuItemClick}>
                      <FaCamera /> <span>New Post</span>
                    </CreateMenuItem>
                    <CreateMenuItem
                      to="/story/create"
                      onClick={handleMenuItemClick}
                    >
                      <FaBookOpen /> <span>New Story</span>
                    </CreateMenuItem>
                    <CreateMenuItem
                      to="/thoughts/create"
                      onClick={handleMenuItemClick}
                    >
                      <FaPen /> <span>New Thought</span>
                    </CreateMenuItem>
                  </CreateMenuDropdown>
                )}
              </CreateMenuContainer>
            )}

            {/* Greeting */}
            {isAuthenticated && (
              <Greeting>
                <span className="greeting-text">Hi,</span>{" "}
                <span className="username">{user?.firstName}</span>
              </Greeting>
            )}

            {/* User Menu (Desktop) */}
            {isAuthenticated ? (
              <UserMenuContainer ref={userMenuRef}>
                <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <UserAvatar>
                    <FaUser />
                  </UserAvatar>
                  <FaChevronDown className="arrow-icon" />
                </UserButton>
                {userMenuOpen && (
                  <UserMenuDropdown>
                    <UserInfo>
                      <strong>{user?.username}</strong>
                      <small>{isAdmin ? "Admin" : "User"}</small>
                    </UserInfo>
                    <MenuDivider />
                    {userMenuItems.map((item) => (
                      <UserMenuItem
                        key={item.path}
                        to={item.path}
                        onClick={handleMenuItemClick}
                      >
                        {item.icon} <span>{item.label}</span>
                      </UserMenuItem>
                    ))}
                    <MenuDivider />
                    <UserMenuButton onClick={handleLogout}>
                      <FaSignOutAlt /> <span>Logout</span>
                    </UserMenuButton>
                  </UserMenuDropdown>
                )}
              </UserMenuContainer>
            ) : (
              <AuthButtons>
                <AuthButton to="/login" secondary="true">
                  <FaSignInAlt /> <span>Login</span>
                </AuthButton>
                <AuthButton to="/register" primary="true">
                  <FaUser /> <span>Register</span>
                </AuthButton>
              </AuthButtons>
            )}

            {/* Mobile Menu Toggle */}
            <MobileMenuToggle
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <FaBars />
            </MobileMenuToggle>
          </HeaderActions>
        </HeaderContent>
      </HeaderContainer>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen}>
        <MobileMenuHeader>
          <MobileMenuLogo>
            <FaCamera /> <span>SoloGram</span>
          </MobileMenuLogo>
          <MobileMenuCloseBtn onClick={() => setMobileMenuOpen(false)}>
            <FaTimes />
          </MobileMenuCloseBtn>
        </MobileMenuHeader>

        {/* Mobile Greeting */}
        {isAuthenticated && (
          <MobileGreeting>
            <span className="greeting-text">Welcome back,</span>
            <span className="username">{user?.firstName}</span>
          </MobileGreeting>
        )}

        {/* Mobile Menu Content */}
        <MobileMenuContent>
          {/* Navigation Items */}
          {navItems.map((item) => (
            <MobileMenuItem
              key={item.path}
              to={item.path}
              active={isPathActive(item.path) ? "true" : undefined}
              onClick={handleMenuItemClick}
            >
              {item.label}
            </MobileMenuItem>
          ))}

          {/* Create options for mobile */}
          {isAuthenticated && (
            <>
              <MobileMenuSection>Create</MobileMenuSection>
              <MobileMenuItem
                to="/create"
                active={location.pathname === "/create" ? "true" : undefined}
                onClick={handleMenuItemClick}
              >
                <FaCamera /> <span>New Post</span>
              </MobileMenuItem>
              <MobileMenuItem
                to="/story/create"
                active={
                  location.pathname === "/story/create" ? "true" : undefined
                }
                onClick={handleMenuItemClick}
              >
                <FaBookOpen /> <span>New Story</span>
              </MobileMenuItem>
              <MobileMenuItem
                to="/thoughts/create"
                active={
                  location.pathname === "/thoughts/create" ? "true" : undefined
                }
                onClick={handleMenuItemClick}
              >
                <FaPen /> <span>New Thought</span>
              </MobileMenuItem>
            </>
          )}

          {/* User-specific Mobile Items */}
          {isAuthenticated ? (
            <>
              <MobileMenuItem
                to="/profile"
                active={location.pathname === "/profile" ? "true" : undefined}
                onClick={handleMenuItemClick}
              >
                <FaUser /> <span>Profile</span>
              </MobileMenuItem>
              <MobileMenuLogoutButton onClick={handleLogout}>
                <FaSignOutAlt /> <span>Logout</span>
              </MobileMenuLogoutButton>
            </>
          ) : (
            <>
              <MobileMenuItem
                to="/login"
                active={
                  location.pathname.startsWith("/login") ? "true" : undefined
                }
                onClick={handleMenuItemClick}
              >
                <FaSignInAlt /> <span>Login</span>
              </MobileMenuItem>
              <MobileMenuItem
                to="/register"
                active={
                  location.pathname.startsWith("/register") ? "true" : undefined
                }
                onClick={handleMenuItemClick}
              >
                <FaUser /> <span>Register</span>
              </MobileMenuItem>
            </>
          )}

          {/* External links section at bottom */}
          <ExternalLinksSection>
            {externalLinks.map((item) => (
              <ExternalMenuItem
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleMenuItemClick}
              >
                {item.label}
              </ExternalMenuItem>
            ))}
          </ExternalLinksSection>
        </MobileMenuContent>
      </MobileMenu>
    </HeaderWrapper>
  );
};

// Styled Components (Refactored for consistency)
const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px ${COLORS.shadow};
`;

const HeaderContainer = styled.header`
  background: ${THEME.header.background};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  gap: 1rem;

  ${(props) =>
    props.searchExpanded &&
    `
    @media (max-width: 768px) {
      justify-content: flex-end;
    }
  `}

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const LogoContainer = styled.div`
  flex: 0 0 auto;

  ${(props) =>
    props.searchExpanded &&
    `
    @media (max-width: 768px) {
      display: none;
    }
  `}
`;

const Logo = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-decoration: none;
  color: inherit;

  .logo-main {
    display: flex;
    align-items: center;
    font-family: "Sora", sans-serif;
    font-size: 2.2rem;
    font-weight: 500;
    color: ${COLORS.textPrimary};
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;

    .logo-text {
      font-family: "Mystery Quest", cursive;
      font-size: 2rem;
      color: ${COLORS.textPrimary};
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.25);
    }

    svg {
      font-size: 2.6rem;
      margin-right: 0.75rem;
      color: ${COLORS.primarySalmon};
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  .tagline {
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    font-weight: 400;
    color: ${COLORS.primaryMint};
    margin-top: 0.2rem;
    margin-left: 0;
    text-align: left;
    line-height: 1.2;
    opacity: 0.9;
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 0.9;
      transform: translateY(0);
    }
  }

  @media (max-width: 767px) {
    .logo-main {
      font-size: 1.5rem;

      svg {
        font-size: 2rem;
      }
    }

    .tagline {
      font-size: 0.75rem;
      text-align: left;
    }
  }
`;

const DesktopNavigation = styled.nav`
  display: flex;
  gap: 2.25rem;
  align-items: center;
  margin-left: 2rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textPrimary};
  text-decoration: none;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  position: relative;
  padding: 0.5rem 0;
  transition: color 0.3s ease;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    width: ${(props) => (props.active ? "100%" : "0")};
    height: 2px;
    background-color: ${COLORS.primarySalmon};
    transition: width 0.3s ease;
  }

  &:hover {
    color: ${COLORS.primarySalmon};

    &:after {
      width: 100%;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const CreateMenuContainer = styled.div`
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
`;

const CreateMenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;

  .arrow-icon {
    font-size: 0.75rem;
    margin-left: 0.25rem;
  }

  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

const CreateMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 4px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  width: 180px;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  z-index: 100;
  border: 1px solid ${COLORS.border};
`;

const CreateMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primarySalmon};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

const AuthButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) =>
    props.primary
      ? COLORS.primarySalmon
      : props.secondary
      ? COLORS.primaryKhaki
      : COLORS.primarySalmon};
  color: ${(props) => (props.secondary ? COLORS.textPrimary : "white")};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.primary
        ? COLORS.accentSalmon
        : props.secondary
        ? COLORS.primaryBlueGray
        : COLORS.accentSalmon};
    color: white;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  z-index: 100;

  @media (max-width: 767px) {
    ${(props) =>
      props.expanded &&
      `
      position: absolute;
      left: 1rem;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      margin: 0;
      width: calc(100% - 2rem);
    `}
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};
  font-size: 1.125rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px ${COLORS.shadow};
  width: 100%;

  @media (min-width: 768px) {
    width: 280px;
  }
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  width: 100%;
  outline: none;
  flex: 1;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const SearchSubmit = styled.button`
  background-color: ${COLORS.primarySalmon};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

const CloseSearchButton = styled.button`
  background-color: rgba(0, 0, 0, 0.2);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s;
  border-left: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background-color: rgba(0, 0, 0, 0.3);
    color: white;
  }

  @media (min-width: 768px) {
    display: none; /* Only show on mobile */
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;

  .arrow-icon {
    font-size: 0.75rem;
    color: ${COLORS.textPrimary};
    transition: transform 0.2s;
  }

  &:hover .arrow-icon {
    color: ${COLORS.primarySalmon};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${COLORS.primaryBlueGray};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  &:hover {
    background-color: ${COLORS.accentBlueGray};
  }
`;

const UserMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 4px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  width: 200px;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  z-index: 100;
  border: 1px solid ${COLORS.border};
`;

const UserInfo = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${COLORS.divider};

  strong {
    display: block;
    color: ${COLORS.textPrimary};
  }

  small {
    color: ${COLORS.textSecondary};
    font-size: 0.75rem;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background-color: ${COLORS.divider};
  margin: 0.5rem 0;
`;

const UserMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primarySalmon};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
  }
`;

const UserMenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primarySalmon};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: ${COLORS.primarySalmon};
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 80%;
  max-width: 300px;
  background-color: ${COLORS.background};
  box-shadow: -2px 0 10px ${COLORS.shadow};
  z-index: 1001;
  transform: ${(props) =>
    props.isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid ${COLORS.divider};
  background: ${THEME.header.background};
`;

const MobileMenuLogo = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textPrimary};
  font-weight: 700;

  svg {
    margin-right: 0.5rem;
    color: ${COLORS.primarySalmon};
  }
`;

const MobileMenuCloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  cursor: pointer;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const MobileMenuContent = styled.div`
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const MobileMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textSecondary};
  text-decoration: none;
  font-weight: 500;
  border-radius: 4px;
  background-color: ${(props) =>
    props.active ? `${COLORS.buttonHover}` : "transparent"};

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primarySalmon};
  }

  svg {
    margin-right: 0.75rem;
  }
`;

const MobileMenuLogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${COLORS.textSecondary};
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.primarySalmon};
  }

  svg {
    margin-right: 0.75rem;
  }
`;

const MobileMenuSection = styled.div`
  font-weight: 600;
  color: ${COLORS.textSecondary};
  padding: 0.75rem 1rem 0.5rem;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-top: 1rem;
  border-top: 1px solid ${COLORS.divider};
`;

const ExternalLinksSection = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid ${COLORS.divider};
`;

const ExternalMenuItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  color: ${COLORS.primaryBlueGray};
  font-weight: 600;
  border-radius: 4px;
  text-decoration: none;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.accentBlueGray};
  }
`;

const Greeting = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 500;
  margin-right: 1.25rem;
  color: ${COLORS.textPrimary};
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  padding: 0.5rem 1rem 0.5rem 1.1rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  /* Subtle shine effect */
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${COLORS.primarySalmon}30;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    border-color: rgba(255, 255, 255, 0.15);

    &:before {
      left: 100%;
    }
  }

  .greeting-text {
    display: inline-block;
    position: relative;

    &:after {
      content: "";
      position: absolute;
      left: 0;
      bottom: -3px;
      width: 100%;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        ${COLORS.primarySalmon}50,
        transparent
      );
      transform: scaleX(0);
      transition: transform 0.3s ease;
      transform-origin: center;
    }
  }

  &:hover .greeting-text:after {
    transform: scaleX(1);
  }

  .username {
    font-family: "Sora", sans-serif;
    color: ${COLORS.primarySalmon};
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-left: 0.5rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    display: inline-block;
    transform-origin: bottom left;
    position: relative;
    top: 0;
  }

  &:hover .username {
    transform: scale(1.05);
    color: ${COLORS.accentSalmon};
    text-shadow: 0 1px 4px ${COLORS.accentSalmon}40;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileGreeting = styled.div`
  position: relative;
  font-size: 0.95rem;
  margin: 1.25rem 1rem;
  padding: 1rem 1.25rem;
  color: ${COLORS.textPrimary};
  border-radius: 8px;
  text-align: center;
  background: ${COLORS.elevatedBackground};
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid ${COLORS.border};
  overflow: hidden;

  /* Highlight on top */
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${COLORS.primarySalmon};
    border-radius: 2px;
  }

  .greeting-text {
    font-weight: 500;
    color: ${COLORS.textSecondary};
    margin-right: 0.25rem;
  }

  .username {
    font-family: "Sora", sans-serif;
    color: ${COLORS.primarySalmon};
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    display: block;
    margin-top: 0.25rem;
    margin-bottom: 0.125rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
`;

export default Header;
