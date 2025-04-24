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
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";
import HeaderSubscriptionBanner from "../subscription/HeaderSubscriptionBanner";
import { toast } from "react-hot-toast";
import { subscribeToNotifications } from "../../utils/notificationService";
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

  const handleSubscribeClick = async () => {
    const loadingToast = toast.loading("Preparing notifications...");

    try {
      const result = await subscribeToNotifications();
      toast.dismiss(loadingToast);

      if (result) {
        toast.success("Subscribed to notifications!");

        localStorage.setItem("subscribeBannerDismissed", "true");
        localStorage.setItem(
          "subscribeBannerDismissedAt",
          Date.now().toString()
        );
      } else {
        toast.error("Unable to subscribe. Check your browser settings.");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Subscription error:", error);
      toast.error("Something went wrong. Try again later.");
    }
  };

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
                Hi, <span className="autography">{user?.firstName}</span>
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
            Hi, <span className="autography">{user?.firstName}</span>
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
          <MobileMenuItem
            onClick={handleSubscribeClick}
            active={location.pathname.startsWith("/subscribe")}
          >
            <span>Subscribe</span>
          </MobileMenuItem>
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

      {showSubscriptionBanner && <HeaderSubscriptionBanner />}
    </HeaderWrapper>
  );
};

// Styled Components (updated with Modern Twilight theme)
const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px ${COLORS.shadow};
`;

const HeaderContainer = styled.header`
  background-color: ${COLORS.primaryPurple};
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
    font-weight: 600;
    color: ${COLORS.textPrimary};
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;

    svg {
      font-size: 2.6rem;
      margin-right: 0.75rem;
    }

    &:hover {
      transform: scale(1.05);
    }
  }

  .tagline {
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    font-style: italic;
    font-weight: 400;
    color: ${COLORS.accentBlue};
    margin-top: 0.4rem;
    margin-left: 0; /* override previous indent */
    text-align: left;
    line-height: 1.2;
    opacity: 0.85;
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 0.85;
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
  color: ${(props) => (props.active ? COLORS.accentGreen : COLORS.textPrimary)};
  text-decoration: none;
  font-weight: ${(props) =>
    props.active ? "600" : "500"}; // Bolder for active state
  position: relative;
  padding: 0.5rem 0;
  transition: color 0.3s ease;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px; // Moved down slightly
    width: ${(props) => (props.active ? "100%" : "0")};
    height: 2px;
    background-color: ${COLORS.primaryGreen};
    transition: width 0.3s ease;
  }

  &:hover {
    color: ${COLORS.accentGreen};

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
    color: ${COLORS.accentGreen};
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
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
    color: ${COLORS.accentGreen};
  }
`;

const SearchSubmit = styled.button`
  background-color: ${COLORS.primaryBlue};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${THEME.button.action.hoverBackground};
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
    color: ${COLORS.textPrimary};
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
    props.thoughts ? COLORS.primaryBlue : COLORS.primaryGreen};
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;
  margin-left: ${(props) => (props.thoughts ? "0.5rem" : "0")};

  &:hover {
    background-color: ${(props) =>
      props.thoughts
        ? THEME.button.action.hoverBackground
        : COLORS.accentGreen};
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
    color: ${COLORS.accentGreen};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textPrimary};

  &:hover {
    color: ${COLORS.accentGreen};
    background-color: rgba(255, 255, 255, 0.3);
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
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primaryPurple};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
  }

  &:hover svg {
    color: ${COLORS.primaryPurple};
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
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primaryPurple};
  }

  svg {
    font-size: 1rem;
    color: ${COLORS.textTertiary};
  }

  &:hover svg {
    color: ${COLORS.primaryPurple};
  }
`;

const LoginButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.15);
  color: ${COLORS.textPrimary};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
    color: ${COLORS.textPrimary};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// Changed name to avoid duplicate identifier
const MobileMenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: ${COLORS.accentGreen};
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
  background-color: ${COLORS.cardBackground};
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
  background-color: ${COLORS.primaryPurple};
`;

const MobileMenuLogo = styled.div`
  display: flex;
  align-items: center;
  color: ${COLORS.textPrimary};
  font-weight: 700;

  svg {
    margin-right: 0.5rem;
  }
`;

const MobileMenuCloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  cursor: pointer;

  &:hover {
    color: ${COLORS.accentGreen};
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
    props.active ? COLORS.primaryPurple : COLORS.textSecondary};
  text-decoration: none;
  font-weight: 500;
  border-radius: 4px;
  background-color: ${(props) =>
    props.active ? `rgba(94, 53, 177, 0.1)` : "transparent"};

  &:hover {
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primaryPurple};
  }

  svg {
    margin-right: 0.75rem;
  }
`;

// Changed name to avoid duplicate identifier
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
    background-color: ${COLORS.elevatedBackground};
    color: ${COLORS.primaryPurple};
  }

  svg {
    margin-right: 0.75rem;
  }
`;

const ExternalMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: ${COLORS.primaryBlue};
  font-weight: 600;
  border-radius: 4px;
  text-decoration: none;

  &:hover {
    background-color: ${COLORS.elevatedBackground};
  }

  svg {
    margin-right: 0.75rem;
    color: ${COLORS.primaryBlue};
  }
`;

const RegisterButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primaryGreen};
  color: ${COLORS.textPrimary};
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.accentGreen};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Greeting = styled.div`
  font-size: 0.95rem;
  margin-right: 1rem;
  color: ${COLORS.textPrimary};
  background-color: rgba(255, 255, 255, 0.15);
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
  }

  .autography {
    font-family: "Autography", cursive;
    color: ${COLORS.accentGreen};
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1.2;
    display: inline-block;
    margin-left: 0.25rem;
    position: relative;
    top: 2px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileGreeting = styled.div`
  font-size: 1rem;
  padding: 0.75rem 1rem 1rem;
  color: ${COLORS.textPrimary};
  background-color: ${COLORS.elevatedBackground};
  margin: 0 1rem;
  border-radius: 20px;
  text-align: center;

  .autography {
    font-family: "Autography", cursive;
    color: ${COLORS.primaryPurple};
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 1px;
    display: inline-block;
    margin-left: 0.25rem;
  }
`;

export default Header;
