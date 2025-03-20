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
  FaSearch
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

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded && searchQuery.trim() === "") {
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
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onClearSearch && onClearSearch();
  };
  
  // Show subscription banner to all users on the homepage
  const showSubscriptionBanner = location.pathname === "/";

  return (
    <HeaderWrapper>
      <HeaderContainer>
        <HeaderContent>
          <Logo to="/" onClick={closeMenu}>
            <div className="logo-main">
              <FaCamera />
              <span>SoloGram</span>
            </div>
            <div className="tagline">One Voice. Infinite Moments.</div>
          </Logo>

          {location.pathname === "/" && (
            <SearchContainer expanded={searchExpanded}>
              <SearchIconButton 
                onClick={toggleSearch}
                aria-label="Toggle search"
              >
                <FaSearch />
              </SearchIconButton>
              
              <SearchForm 
                expanded={searchExpanded}
                onSubmit={handleSearchSubmit}
              >
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
                  >
                    <FaTimes />
                  </ClearButton>
                )}
                
                <SearchSubmit type="submit">
                  <FaSearch />
                </SearchSubmit>
              </SearchForm>
            </SearchContainer>
          )}

          <MobileMenuIcon onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </MobileMenuIcon>

          <Navigation className={isMenuOpen ? "active" : ""}>
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

  @media (max-width: 768px) {
    padding: 1rem;
  }
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
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  margin-left: auto;
  margin-right: 1.5rem;
  z-index: 100;
  
  @media (max-width: 768px) {
    margin-right: 1rem;
    position: ${props => props.expanded ? 'absolute' : 'relative'};
    right: ${props => props.expanded ? '3.5rem' : 'auto'};
    left: ${props => props.expanded ? '1rem' : 'auto'};
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
  width: ${props => props.expanded ? '240px' : '0'};
  opacity: ${props => props.expanded ? '1' : '0'};
  visibility: ${props => props.expanded ? 'visible' : 'hidden'};
  position: absolute;
  right: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: ${props => props.expanded ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'};
  
  @media (max-width: 768px) {
    width: ${props => props.expanded ? 'calc(100% - 3.5rem)' : '0'};
    right: 0;
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

const MobileMenuIcon = styled.div`
  display: none;
  font-size: 1.5rem;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Navigation = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;

  @media (max-width: 768px) {
    flex-direction: column;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    display: none;
    z-index: 1001;

    &.active {
      display: flex;
    }
  }
`;

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
  bottom: 2rem;
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