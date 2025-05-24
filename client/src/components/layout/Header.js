import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaCamera,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaSearch,
  FaTimes,
  FaLightbulb,
  FaImages,
  FaFolder,
  FaHome,
  FaRobot, // Add this for AI icon
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";
import { COLORS, THEME } from "../../theme";

const Header = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for handling click outside
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);

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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchExpanded, userMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setSearchExpanded(false);
  }, [location.pathname]);

  // Auth and Navigation Handlers
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  // Search Handlers
  const handleToggleSearch = () => setSearchExpanded(!searchExpanded);

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
      setSearchExpanded(false);
    } else {
      handleCloseSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onClearSearch && onClearSearch();
    searchInputRef.current.focus();
  };

  // Helper to check if a path is active
  const isActivePath = (path) => {
    if (path === "/") {
      return location.pathname === "/" && !location.search.includes("search");
    }
    return location.pathname.startsWith(path);
  };

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <HeaderContent>
          {/* Logo */}
          <LogoContainer>
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
            <NavItem to="/" active={isActivePath("/")}>
              <FaHome />
              <span>Home</span>
            </NavItem>
            <NavItem to="/thoughts" active={isActivePath("/thoughts")}>
              <FaLightbulb />
              <span>Thoughts</span>
            </NavItem>
            <NavItem
              to="/media-gallery"
              active={isActivePath("/media-gallery")}
            >
              <FaImages />
              <span>Gallery</span>
            </NavItem>
            <NavItem to="/collections" active={isActivePath("/collections")}>
              <FaFolder />
              <span>Collections</span>
            </NavItem>
            {/* Admin-only AI Content Generator link */}
            {isAdmin && (
              <NavItem
                to="/admin/ai-content"
                active={isActivePath("/admin/ai-content")}
              >
                <FaRobot />
                <span>AI Content</span>
              </NavItem>
            )}
          </DesktopNavigation>

          {/* Right Side Actions */}
          <HeaderActions>
            {/* Search */}
            {searchExpanded ? (
              <SearchContainer ref={searchContainerRef}>
                <SearchForm onSubmit={handleSearchSubmit}>
                  <SearchInput
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search posts and thoughts..."
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
                  <CloseSearchButton
                    onClick={handleCloseSearch}
                    aria-label="Close search"
                    type="button"
                  >
                    <FaTimes />
                  </CloseSearchButton>
                </SearchForm>
              </SearchContainer>
            ) : (
              <ActionButton onClick={handleToggleSearch} aria-label="Search">
                <FaSearch />
              </ActionButton>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <UserMenuContainer ref={userMenuRef}>
                <UserButton
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  active={userMenuOpen ? "true" : undefined}
                >
                  <UserAvatar>
                    <FaUser />
                  </UserAvatar>
                </UserButton>

                {userMenuOpen && (
                  <UserMenuDropdown>
                    <UserInfo>
                      <strong>{user?.username}</strong>
                      <small>{user?.role === "admin" ? "Admin" : "User"}</small>
                    </UserInfo>
                    <MenuDivider />
                    <UserMenuItem to="/profile">
                      <FaUser /> <span>Profile</span>
                    </UserMenuItem>
                    {/* Admin-only menu item */}
                    {isAdmin && (
                      <UserMenuItem to="/admin/ai-content">
                        <FaRobot /> <span>AI Content Generator</span>
                      </UserMenuItem>
                    )}
                    <MenuDivider />
                    <UserMenuButton onClick={handleLogout}>
                      <FaSignOutAlt /> <span>Logout</span>
                    </UserMenuButton>
                  </UserMenuDropdown>
                )}
              </UserMenuContainer>
            ) : (
              <AuthButton to="/login">
                <FaSignInAlt />
              </AuthButton>
            )}
          </HeaderActions>
        </HeaderContent>
      </HeaderContainer>
    </HeaderWrapper>
  );
};

// Styled Components (same as before, no changes needed)
const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${THEME.header.background};
  border-bottom: 1px solid ${COLORS.border};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
`;

const HeaderContainer = styled.header`
  max-width: 975px;
  width: 100%;
  margin: 0 auto;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  height: 60px;
  position: relative;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const LogoContainer = styled.div`
  flex: 0 0 auto;

  @media (max-width: 768px) {
    flex: 1;
  }
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
    font-weight: 500;
    color: ${COLORS.textPrimary};
    transition: transform 0.3s ease;

    .logo-text {
      font-family: "Mystery Quest", cursive;
      font-size: 1.8rem;
      color: ${COLORS.textPrimary};
    }

    svg {
      font-size: 2rem;
      margin-right: 0.75rem;
      color: ${COLORS.primarySalmon};
    }
  }

  .tagline {
    font-family: "Inter", sans-serif;
    font-size: 0.85rem;
    font-weight: 400;
    color: ${COLORS.primaryMint};
    margin-top: 0.2rem;
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    .logo-main {
      .logo-text {
        font-size: 1.5rem;
      }
      svg {
        font-size: 1.7rem;
      }
    }
    .tagline {
      font-size: 0.75rem;
    }
  }
`;

const DesktopNavigation = styled.nav`
  display: none;

  @media (min-width: 769px) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
    margin: 0 2rem;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textSecondary};
  background-color: ${(props) =>
    props.active ? `${COLORS.primarySalmon}15` : "transparent"};
  text-decoration: none;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  font-size: 0.9rem;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primarySalmon}15;
    transform: translateY(-1px);
  }

  svg {
    font-size: 1.1rem;
  }

  span {
    font-family: "Inter", sans-serif;
  }

  ${(props) =>
    props.active &&
    `
    &::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 2px;
      background-color: ${COLORS.primarySalmon};
      border-radius: 1px;
    }
  `}
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 0 0 auto;
`;

const SearchContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  background-color: ${THEME.header.background};
  z-index: 10;
  padding: 0 1rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};
  font-size: 1.25rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;

  &:hover {
    color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primarySalmon}15;
    transform: scale(1.1);
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: ${COLORS.inputBackground};
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid ${COLORS.border};
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  transition: border-color 0.2s ease;

  &:focus-within {
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}15;
  }
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${COLORS.textPrimary};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  width: 100%;
  outline: none;
  flex: 1;
  font-family: "Inter", sans-serif;

  &::placeholder {
    color: ${COLORS.textTertiary};
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: color 0.2s ease;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const CloseSearchButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0 12px 12px 0;

  &:hover {
    color: ${COLORS.primarySalmon};
    background-color: ${COLORS.primarySalmon}15;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  border: ${(props) =>
    props.active
      ? `2px solid ${COLORS.primarySalmon}`
      : "2px solid transparent"};
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    border-color: ${COLORS.primarySalmon};
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${COLORS.primarySalmon}30;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px ${COLORS.primarySalmon}40;
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }
`;

const UserMenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  box-shadow: 0 8px 32px ${COLORS.shadow};
  width: 200px;
  overflow: hidden;
  z-index: 100;
  border: 1px solid ${COLORS.border};
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-0.5rem) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const UserInfo = styled.div`
  padding: 1rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon}10,
    ${COLORS.primaryMint}10
  );

  strong {
    display: block;
    color: ${COLORS.textPrimary};
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  small {
    color: ${COLORS.textSecondary};
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    ${COLORS.divider},
    transparent
  );
`;

const UserMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  color: ${COLORS.textSecondary};
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon}10,
      ${COLORS.primaryMint}05
    );
    color: ${COLORS.primarySalmon};
    transform: translateX(4px);
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
    transition: color 0.2s ease;
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
  padding: 0.875rem 1rem;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon}10,
      ${COLORS.primaryMint}05
    );
    color: ${COLORS.primarySalmon};
    transform: translateX(4px);
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
  }
`;

const AuthButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: white;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px ${COLORS.primarySalmon}30;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 16px ${COLORS.primarySalmon}40;
  }

  @media (max-width: 480px) {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
`;

export default Header;
