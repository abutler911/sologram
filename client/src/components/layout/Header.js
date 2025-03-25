import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaCamera,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaBars,
  FaTimes,
  FaFolder,
  FaPlus,
  FaArchive,
  FaBell,
  FaSearch,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import HeaderSubscriptionBanner from "../subscription/HeaderSubscriptionBanner";

const Header = ({ onSearch, onClearSearch }) => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("search") || "";
    setSearchQuery(query);

    if (location.pathname === "/" && query && onSearch) {
      onSearch(query);
    }
  }, [location, onSearch]);

  // Handle clicks outside of search to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchExpanded &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        handleCloseSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchExpanded]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleOpenSearch = () => {
    setSearchExpanded(true);
  };

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

      // Don't close search after successful submission
    } else {
      // If search is empty, close the search bar
      handleCloseSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onClearSearch && onClearSearch();
    searchInputRef.current.focus(); // Keep focus on input after clearing
  };

  // Show subscription banner to all users on the homepage
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

          {location.pathname === "/" && (
            <SearchContainer ref={searchContainerRef} expanded={searchExpanded}>
              {!searchExpanded ? (
                <SearchIconButton
                  onClick={handleOpenSearch}
                  aria-label="Open search"
                >
                  <FaSearch />
                </SearchIconButton>
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

          {/* Add mobile sign-in button when not authenticated */}
          {!isAuthenticated ? (
            <MobileAuthButton to="/login">
              <FaSignInAlt />
            </MobileAuthButton>
          ) : (
            <MobileLogoutButton onClick={handleLogout}>
              <FaSignOutAlt />
            </MobileLogoutButton>
          )}

          <Navigation
            className={isMenuOpen ? "active" : ""}
            searchExpanded={searchExpanded}
          >
            {isAuthenticated ? (
              <>
                <NavItem>
                  <CreatePostButton to="/create" onClick={closeMenu}>
                    <FaPlus />
                    <span>Create Post</span>
                  </CreatePostButton>
                </NavItem>
                <NavItem>
                  <NavLink to="/collections" onClick={closeMenu}>
                    <FaFolder />
                    <span>Collections</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink to="/story-archive" onClick={closeMenu}>
                    <FaArchive />
                    <span>Story Archive</span>
                  </NavLink>
                </NavItem>

                {isAdmin && (
                  <NavItem>
                    <NavLink to="/subscribers" onClick={closeMenu}>
                      <FaBell />
                      <span>Subscribers</span>
                    </NavLink>
                  </NavItem>
                )}

                <NavItem>
                  <NavLink to="/profile" onClick={closeMenu}>
                    <FaUser />
                    <span>{user?.username}</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <LogoutButton onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </LogoutButton>
                </NavItem>
              </>
            ) : (
              <>
                <NavItem>
                  <NavLink to="/collections" onClick={closeMenu}>
                    <FaFolder />
                    <span>Collections</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink to="/login" onClick={closeMenu}>
                    <FaSignInAlt />
                    <span>Login</span>
                  </NavLink>
                </NavItem>
              </>
            )}
          </Navigation>
        </HeaderContent>
      </HeaderContainer>

      {/* Show subscription banner for all users on homepage */}
      {showSubscriptionBanner && <HeaderSubscriptionBanner />}

      {isAuthenticated && (
        <FloatingActionButtonContainer>
          <FloatingActionButton onClick={toggleCreateOptions}>
            <FaPlus />
          </FloatingActionButton>

          {showCreateOptions && (
            <ActionOptions>
              <ActionOption
                to="/create"
                onClick={() => setShowCreateOptions(false)}
              >
                <FaCamera />
                <span>New Post</span>
              </ActionOption>
              {isAdmin && (
                <>
                  <ActionOption
                    to="/collections/create"
                    onClick={() => setShowCreateOptions(false)}
                  >
                    <FaFolder />
                    <span>New Collection</span>
                  </ActionOption>
                  <ActionOption
                    to="/subscribers"
                    onClick={() => setShowCreateOptions(false)}
                  >
                    <FaBell />
                    <span>Manage Subscribers</span>
                  </ActionOption>
                </>
              )}
              <ActionOption
                to="/create-story"
                onClick={() => setShowCreateOptions(false)}
              >
                <FaCamera />
                <span>New Story</span>
              </ActionOption>
            </ActionOptions>
          )}
        </FloatingActionButtonContainer>
      )}
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
  padding: 1rem 2rem;
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
    padding: 1rem;
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
  color: #ff7e5f;
  text-decoration: none;

  .logo-main {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .tagline {
    font-size: 0.7rem;
    font-style: italic;
    font-weight: 400;
    color: #666;
    margin-left: 0;
  }

  span {
    margin-left: 0.5rem;
  }

  svg {
    font-size: 1.8rem;
  }

  @media (max-width: 767px) {
    .logo-main {
      font-size: 1.2rem;
    }

    svg {
      font-size: 1.4rem;
    }

    .tagline {
      font-size: 0.6rem;
    }
  }
`;

const MobileAuthButton = styled(Link)`
  display: none; /* Hidden by default */
  background: none;
  border: none;
  color: #4a4a4a;
  font-size: 1.25rem;
  padding: 0.5rem;
  margin-left: auto;
  z-index: 5;

  &:hover {
    color: #ff7e5f;
  }

  @media (max-width: 767px) {
    display: flex; /* Only show on mobile */
    align-items: center;
    justify-content: center;
  }
`;

const MobileLogoutButton = styled.button`
  display: none; /* Hidden by default */
  background: none;
  border: none;
  color: #4a4a4a;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: auto;
  z-index: 5;

  &:hover {
    color: #ff7e5f;
  }

  @media (max-width: 767px) {
    display: flex; /* Only show on mobile */
    align-items: center;
    justify-content: center;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  margin-left: auto;
  margin-right: 1.5rem;
  z-index: 100;

  @media (max-width: 767px) {
    margin-right: 0.5rem;
    margin-left: 0;

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

const SearchIconButton = styled.button`
  background: none;
  border: none;
  color: #4a4a4a;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
  z-index: 101;

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

const Navigation = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;

  ${(props) =>
    props.searchExpanded &&
    `
    @media (max-width: 767px) {
      display: none;
    }
  `}

  @media (max-width: 767px) {
    display: none; /* Hide navigation on mobile since we have bottom nav */
  }
`;

// Rest of your styled components remain the same
const NavItem = styled.li`
  margin-left: 1.5rem;

  @media (max-width: 768px) {
    margin: 0;
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: #4a4a4a;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem;
  transition: color 0.3s ease;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 2rem;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  color: #4a4a4a;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 2rem;
    width: 100%;
    text-align: left;
  }
`;

const CreatePostButton = styled(Link)`
  display: flex;
  align-items: center;
  color: white;
  background-color: #ff7e5f;
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff6347;
    color: white;
  }

  svg {
    margin-right: 0.5rem;
  }

  @media (max-width: 768px) {
    margin: 0.75rem 2rem;
  }
`;

const FloatingActionButtonContainer = styled.div`
  position: fixed;
  bottom: 5rem; /* Positioned above bottom navbar */
  right: 2rem;
  z-index: 100;
`;

const FloatingActionButton = styled.button`
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  font-size: 1.5rem;
  transition: background-color 0.3s ease, transform 0.2s ease;

  &:hover {
    background-color: #ff6347;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ActionOptions = styled.div`
  position: absolute;
  bottom: 4.5rem;
  right: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  width: 150px;
`;

const ActionOption = styled(Link)`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #4a4a4a;
  text-decoration: none;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #f5f5f5;
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }

  span {
    font-weight: 500;
  }
`;

export default Header;
