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
  FaBell,
  FaSearch,
  FaChevronDown,
  FaEllipsisV,
  FaImage,
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";

import { toast } from "react-hot-toast";

import { COLORS, THEME } from "../../theme";

const Header = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search") || "";
    setSearchQuery(query);
    if (location.pathname === "/" && query && onSearch) {
      onSearch(query);
    }
  }, [location, onSearch]);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

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
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchExpanded, showUserMenu]);

  useEffect(() => {
    // Close mobile menu on any route change
    setIsMenuOpen(false);
    setShowUserMenu(false);
    setSearchExpanded(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate("/login");
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);

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

  const showSubscriptionBanner = location.pathname === "/";

  const handleLinkClick = () => {
    closeMenu();
    setShowUserMenu(false);
    setSearchExpanded(false);
  };

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <HeaderContent searchExpanded={searchExpanded}>
          <LogoContainer searchExpanded={searchExpanded}>
            <Logo to="/">
              <div className="logo-main">
                <FaCamera />
                <span>SoloGram</span>
              </div>
              <div className="tagline">One Voice. Infinite Moments.</div>
            </Logo>
          </LogoContainer>

          <DesktopNavigation>
            <NavLink to="/" active={location.pathname === "/"}>
              Home
            </NavLink>
            <NavLink
              to="/collections"
              active={location.pathname.startsWith("/collections")}
            >
              Collections
            </NavLink>
            <NavLink
              to="/thoughts"
              active={location.pathname.startsWith("/thoughts")}
            >
              Thoughts
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to="/story-archive"
                active={location.pathname.startsWith("/story-archive")}
              >
                Stories
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/subscribers"
                active={location.pathname.startsWith("/subscribers")}
              >
                Subscribers
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/media-gallery"
                active={location.pathname.startsWith("/media-gallery")}
              >
                Media Gallery
              </NavLink>
            )}
            {/* 🔥 SoloUnderground external link */}
            <NavLink
              as="a"
              href="https://solounderground.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              SoloUnderground
            </NavLink>
          </DesktopNavigation>

          <HeaderActions>
            {location.pathname === "/" && (
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

            {isAuthenticated && !searchExpanded && (
              <>
                <CreateNewButtonDesktop to="/create">
                  <FaCamera />
                  <span>Create</span>
                </CreateNewButtonDesktop>
                {/* Add a button for creating thoughts */}
              </>
            )}
            {isAuthenticated && (
              <Greeting>
                <span className="greeting-text">Hi,</span>{" "}
                <span className="username">{user?.firstName}</span>
              </Greeting>
            )}

            {isAuthenticated ? (
              <UserMenuContainer ref={userMenuRef}>
                <UserButton onClick={toggleUserMenu}>
                  <UserAvatar>
                    <FaUser />
                  </UserAvatar>
                  <FaChevronDown className="arrow-icon" />
                </UserButton>
                {showUserMenu && (
                  <UserMenuDropdown>
                    <UserInfo>
                      <strong>{user?.username}</strong>
                      <small>{isAdmin ? "Admin" : "User"}</small>
                    </UserInfo>
                    <MenuDivider />
                    {isAdmin && (
                      <UserMenuItem
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaUser /> <span>Admin</span>
                      </UserMenuItem>
                    )}

                    {isAdmin && (
                      <UserMenuItem
                        to="/subscribers"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaBell /> <span>Subscribers</span>
                      </UserMenuItem>
                    )}

                    {isAdmin && (
                      <UserMenuItem
                        to="/media-gallery"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FaImage /> <span>Media Gallery</span>
                      </UserMenuItem>
                    )}
                    <UserMenuItem
                      to="/collections"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaFolder /> <span>Collections</span>
                    </UserMenuItem>
                    <UserMenuItem
                      to="/story-archive"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaArchive /> <span>Story Archive</span>
                    </UserMenuItem>
                    <UserMenuItem
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>Profile</span>
                    </UserMenuItem>
                    <MenuDivider />
                    <UserMenuButton onClick={handleLogout}>
                      <FaSignOutAlt /> <span>Logout</span>
                    </UserMenuButton>
                  </UserMenuDropdown>
                )}
              </UserMenuContainer>
            ) : (
              <>
                <LoginButton to="/login">
                  <FaSignInAlt /> <span>Login</span>
                </LoginButton>
                <RegisterButton to="/register">
                  <FaUser /> <span>Register</span>
                </RegisterButton>
              </>
            )}

            <MobileMenuToggle onClick={toggleMenu}>
              <FaEllipsisV />
            </MobileMenuToggle>
          </HeaderActions>
        </HeaderContent>
      </HeaderContainer>

      <MobileMenu isOpen={isMenuOpen}>
        <MobileMenuHeader>
          <MobileMenuLogo>
            <FaCamera /> <span>SoloGram</span>
          </MobileMenuLogo>
          <MobileMenuCloseBtn onClick={closeMenu}>
            <FaTimes />
          </MobileMenuCloseBtn>
        </MobileMenuHeader>
        {isAuthenticated && (
          <MobileGreeting>
            <span className="greeting-text">Welcome back,</span>
            <span className="username">{user?.firstName}</span>
          </MobileGreeting>
        )}

        <MobileMenuContent>
          <MobileMenuItem
            to="/"
            active={location.pathname === "/"}
            onClick={handleLinkClick}
          >
            Home
          </MobileMenuItem>
          <MobileMenuItem
            to="/collections"
            active={location.pathname.startsWith("/collections")}
            onClick={handleLinkClick}
          >
            Collections
          </MobileMenuItem>
          <MobileMenuItem
            to="/thoughts"
            active={location.pathname.startsWith("/thoughts")}
            onClick={handleLinkClick}
          >
            <span>Thoughts</span>
          </MobileMenuItem>

          {isAdmin && (
            <MobileMenuItem
              to="/media-gallery"
              active={location.pathname.startsWith("/media-gallery")}
              onClick={handleLinkClick}
            >
              Media Gallery
            </MobileMenuItem>
          )}
          {isAuthenticated && (
            <>
              <MobileMenuItem
                to="/story-archive"
                active={location.pathname.startsWith("/story-archive")}
                onClick={handleLinkClick}
              >
                Stories
              </MobileMenuItem>
              <MobileMenuItem
                to="/profile"
                active={location.pathname === "/profile"}
                onClick={handleLinkClick}
              >
                <span>Profile</span>
              </MobileMenuItem>

              {isAdmin && (
                <>
                  <MobileMenuItem
                    to="/admin"
                    active={location.pathname.startsWith("/admin")}
                    onClick={handleLinkClick}
                  >
                    Admin
                  </MobileMenuItem>
                  <MobileMenuItem
                    to="/subscribers"
                    active={location.pathname.startsWith("/subscribers")}
                    onClick={handleLinkClick}
                  >
                    Subscribers
                  </MobileMenuItem>
                </>
              )}

              <MobileMenuLogoutButton onClick={handleLogout}>
                <FaSignOutAlt /> <span>Logout</span>
              </MobileMenuLogoutButton>
            </>
          )}

          {!isAuthenticated && (
            <>
              <MobileMenuItem
                to="/login"
                active={location.pathname.startsWith("/login")}
              >
                <FaSignInAlt /> <span>Login</span>
              </MobileMenuItem>
              <MobileMenuItem
                to="/register"
                active={location.pathname.startsWith("/register")}
              >
                <FaUser /> <span>Register</span>
              </MobileMenuItem>
            </>
          )}

          <MenuDivider />
          <ExternalMenuItem
            href="https://solounderground.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
          >
            <FaExternalLinkAlt style={{ marginRight: "0.75rem" }} />
            SoloUnderground
          </ExternalMenuItem>
        </MobileMenuContent>
      </MobileMenu>
    </HeaderWrapper>
  );
};

// Styled Components (updated with the new Salmon, Khaki, Mint Blue, and Blue Gray Theme)
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
  gap: 1rem; // Add gap to space out all elements

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
  flex: 0 0 auto; // Don't let it stretch

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
    font-weight: 700;
    color: ${COLORS.textPrimary};
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;

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
    props.active ? COLORS.accentSalmon : COLORS.textPrimary};
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
    background-color: ${COLORS.accentSalmon};
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

const CreateNewButtonDesktop = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) =>
    props.thoughts ? COLORS.primaryMint : COLORS.primarySalmon};
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  margin-left: ${(props) => (props.thoughts ? "0.5rem" : "0")};

  &:hover {
    background-color: ${(props) =>
      props.thoughts ? COLORS.accentMint : COLORS.accentSalmon};
  }

  @media (max-width: 768px) {
    display: none;
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

const LoginButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primaryKhaki};
  color: ${COLORS.textPrimary};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.primaryBlueGray};
    color: white;
  }

  @media (max-width: 768px) {
    display: none;
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

const ExternalMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${COLORS.primaryBlueGray};
  font-weight: 600;
  border-radius: 4px;
  text-decoration: none;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.accentBlueGray};
  }

  svg {
    margin-right: 0.75rem;
    color: ${COLORS.primaryBlueGray};
  }
`;

const RegisterButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primarySalmon};
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
  }

  @media (max-width: 768px) {
    display: none;
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
