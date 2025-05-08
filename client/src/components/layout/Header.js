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
  FaCompass,
  FaRegHeart,
  FaPlus,
  FaHome,
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

          {/* Right Side Actions */}
          <HeaderActions>
            {/* Search */}
            {searchExpanded ? (
              <SearchContainer ref={searchContainerRef}>
                <SearchForm onSubmit={handleSearchSubmit}>
                  <SearchInput
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
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

            {/* Icon Navigation (Visible when not searching) */}
            {!searchExpanded && isAuthenticated && (
              <IconNavigation>
                <IconLink
                  to="/"
                  active={location.pathname === "/" ? "true" : undefined}
                >
                  <FaHome />
                </IconLink>
                <IconLink
                  to="/explore"
                  active={location.pathname === "/explore" ? "true" : undefined}
                >
                  <FaCompass />
                </IconLink>
                <CreateButton to="/create">
                  <FaPlus />
                </CreateButton>
                <IconLink
                  to="/notifications"
                  active={
                    location.pathname === "/notifications" ? "true" : undefined
                  }
                >
                  <FaRegHeart />
                </IconLink>
              </IconNavigation>
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

// Styled Components
const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: ${THEME.header.background};
  border-bottom: 1px solid ${COLORS.border};
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
`;

const LogoContainer = styled.div`
  flex: 0 0 auto;
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
      font-size: 1.5rem;
      color: ${COLORS.textPrimary};
    }

    svg {
      font-size: 1.7rem;
      margin-right: 0.5rem;
      color: ${COLORS.primarySalmon};
    }
  }

  .tagline {
    font-family: "Inter", sans-serif;
    font-size: 0.7rem;
    font-weight: 400;
    color: ${COLORS.primaryMint};
    margin-top: 0.1rem;
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    .logo-main {
      .logo-text {
        font-size: 1.3rem;
      }
      svg {
        font-size: 1.5rem;
      }
    }
    .tagline {
      font-size: 0.6rem;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
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
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: ${COLORS.inputBackground};
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${COLORS.border};
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
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
  font-size: 0.75rem;

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
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const IconNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;

  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const IconLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textPrimary};
  font-size: 1.25rem;
  transition: color 0.3s, transform 0.2s;

  &:hover {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.primarySalmon};
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
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
    props.active ? `2px solid ${COLORS.primarySalmon}` : "none"};
  border-radius: 50%;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${COLORS.buttonHover};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.primaryBlueGray};
    color: white;
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
  border-radius: 8px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  width: 200px;
  overflow: hidden;
  z-index: 100;
  border: 1px solid ${COLORS.border};
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const UserInfo = styled.div`
  padding: 0.75rem 1rem;

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

const AuthButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  border-radius: 4px;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
    transform: scale(1.1);
  }

  @media (max-width: 480px) {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }
`;

export default Header;
