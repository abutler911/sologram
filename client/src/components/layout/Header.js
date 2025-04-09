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

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <HeaderContent searchExpanded={searchExpanded}>
          <LogoContainer searchExpanded={searchExpanded}>
            <Logo to="/" onClick={closeMenu}>
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
              <CreateNewButtonDesktop to="/create">
                <FaCamera />
                <span>Create</span>
              </CreateNewButtonDesktop>
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
                    <UserMenuItem
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FaUser /> <span>Admin</span>
                    </UserMenuItem>
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
                    <MenuDivider />
                    <UserMenuButton onClick={handleLogout}>
                      <FaSignOutAlt /> <span>Logout</span>
                    </UserMenuButton>
                  </UserMenuDropdown>
                )}
              </UserMenuContainer>
            ) : (
              <LoginButton to="/login">
                <FaSignInAlt /> <span>Login</span>
              </LoginButton>
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

        <MobileMenuContent>
          <MobileMenuItem
            to="/"
            onClick={closeMenu}
            active={location.pathname === "/"}
          >
            Home
          </MobileMenuItem>
          <MobileMenuItem
            to="/collections"
            onClick={closeMenu}
            active={location.pathname.startsWith("/collections")}
          >
            Collections
          </MobileMenuItem>
          {isAuthenticated && (
            <>
              <MobileMenuItem
                to="/story-archive"
                onClick={closeMenu}
                active={location.pathname.startsWith("/story-archive")}
              >
                Stories
              </MobileMenuItem>
              <MobileMenuItem
                to="/admin"
                onClick={closeMenu}
                active={location.pathname.startsWith("/admin")}
              >
                Admin
              </MobileMenuItem>
              {isAdmin && (
                <MobileMenuItem
                  to="/subscribers"
                  onClick={closeMenu}
                  active={location.pathname.startsWith("/subscribers")}
                >
                  Subscribers
                </MobileMenuItem>
              )}
              <MobileMenuLogoutButton onClick={handleLogout}>
                <FaSignOutAlt /> <span>Logout</span>
              </MobileMenuLogoutButton>
            </>
          )}
          {!isAuthenticated && (
            <MobileMenuItem
              to="/login"
              onClick={closeMenu}
              active={location.pathname.startsWith("/login")}
            >
              {" "}
              <FaSignInAlt /> <span>Login</span>
            </MobileMenuItem>
          )}
          <MenuDivider />
          <ExternalMenuItem
            href="https://solounderground.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
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

// Styled Components (updated ones)
const HeaderWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HeaderContainer = styled.header`
  background-color: #ffffff;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

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
    color: #ff7e5f;

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
    color: #666;
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
  gap: 1.5rem;
  align-items: center;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${(props) => (props.active ? "#ff7e5f" : "#4a4a4a")};
  text-decoration: none;
  font-weight: 500;
  position: relative;
  padding: 0.5rem 0;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: ${(props) => (props.active ? "100%" : "0")};
    height: 2px;
    background-color: #ff7e5f;
    transition: width 0.3s ease;
  }

  &:hover {
    color: #ff7e5f;

    &:after {
      width: 100%;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
  color: #4a4a4a;
  font-size: 1.125rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;

  @media (min-width: 768px) {
    width: 280px;
  }
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: #4a4a4a;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  width: 100%;
  outline: none;
  flex: 1;

  &::placeholder {
    color: #999;
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 0.75rem;

  &:hover {
    color: #ff7e5f;
  }
`;

const SearchSubmit = styled.button`
  background-color: #ff7e5f;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }
`;

const CloseSearchButton = styled.button`
  background-color: #eee;
  border: none;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background-color 0.3s;
  border-left: 1px solid #ddd;

  &:hover {
    background-color: #ddd;
    color: #333;
  }

  @media (min-width: 768px) {
    display: none; /* Only show on mobile */
  }
`;

const CreateNewButtonDesktop = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #ff7e5f;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
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
    color: #666;
    transition: transform 0.2s;
  }

  &:hover .arrow-icon {
    color: #ff7e5f;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;

  &:hover {
    color: #ff7e5f;
  }
`;

const UserMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 200px;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  z-index: 100;
`;

const UserInfo = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;

  strong {
    display: block;
    color: #333;
  }

  small {
    color: #888;
    font-size: 0.75rem;
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background-color: #eee;
  margin: 0.5rem 0;
`;

const UserMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #4a4a4a;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9f9f9;
    color: #ff7e5f;
  }

  svg {
    font-size: 1rem;
    color: #777;
  }

  &:hover svg {
    color: #ff7e5f;
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
  color: #4a4a4a;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9f9f9;
    color: #ff7e5f;
  }

  svg {
    font-size: 1rem;
    color: #777;
  }

  &:hover svg {
    color: #ff7e5f;
  }
`;

const LoginButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #f0f0f0;
  color: #4a4a4a;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s;

  &:hover {
    background-color: #e0e0e0;
    color: #ff7e5f;
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
  color: #4a4a4a;
  cursor: pointer;
  padding: 0.5rem;

  &:hover {
    color: #ff7e5f;
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
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
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
  border-bottom: 1px solid #eee;
`;

const MobileMenuLogo = styled.div`
  display: flex;
  align-items: center;
  color: #ff7e5f;
  font-weight: 700;

  svg {
    margin-right: 0.5rem;
  }
`;

const MobileMenuCloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #777;
  cursor: pointer;

  &:hover {
    color: #ff7e5f;
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
  color: ${(props) => (props.active ? "#ff7e5f" : "#4a4a4a")};
  text-decoration: none;
  font-weight: 500;
  border-radius: 4px;
  background-color: ${(props) =>
    props.active ? "rgba(255, 126, 95, 0.1)" : "transparent"};

  &:hover {
    background-color: rgba(255, 126, 95, 0.1);
    color: #ff7e5f;
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
  color: #4a4a4a;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 126, 95, 0.1);
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.75rem;
  }
`;

const ExternalMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #ff7e5f;
  font-weight: 600;
  border-radius: 4px;
  text-decoration: none;

  &:hover {
    background-color: rgba(255, 126, 95, 0.1);
  }

  svg {
    margin-right: 0.75rem;
    color: #ff7e5f;
  }
`;

export default Header;
