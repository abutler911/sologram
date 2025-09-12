import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HeaderWrapper,
  HeaderContainer,
  HeaderContent,
  LogoContainer,
  Logo,
  DesktopNavigation,
  NavItem,
  HeaderActions,
  SearchContainer,
  ActionButton,
  SearchForm,
  SearchInput,
  ClearButton,
  CloseSearchButton,
  UserMenuContainer,
  UserButton,
  UserAvatar,
  UserMenuDropdown,
  UserInfo,
  MenuDivider,
  UserMenuItem,
  UserMenuButton,
  AuthButton,
} from "./Header.styles";
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
  FaRobot,
  FaArchive,
} from "react-icons/fa";

import { AuthContext } from "../../context/AuthContext";

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
  const canCreate =
    isAuthenticated && (user?.role === "admin" || user?.role === "creator");

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
            {/* Creator/Admin quick actions on desktop */}
            {canCreate && (
              <>
                <NavItem to="/create" active={isActivePath("/create")}>
                  <FaCamera />
                  <span>New Post</span>
                </NavItem>
                <NavItem
                  to="/create-story"
                  active={isActivePath("/create-story")}
                >
                  <FaImages />
                  <span>New Story</span>
                </NavItem>
                <NavItem
                  to="/story-archive"
                  active={isActivePath("/story-archive")}
                >
                  <FaArchive />
                  <span>Story Archive</span>
                </NavItem>
              </>
            )}

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
                    {/* Quick create + archive in user menu */}
                    {canCreate && (
                      <>
                        <UserMenuItem to="/create">
                          <FaCamera /> <span>New Post</span>
                        </UserMenuItem>
                        <UserMenuItem to="/create-story">
                          <FaImages /> <span>New Story</span>
                        </UserMenuItem>
                        <UserMenuItem to="/story-archive">
                          <FaArchive /> <span>Story Archive</span>
                        </UserMenuItem>
                        <MenuDivider />
                      </>
                    )}

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

export default Header;
