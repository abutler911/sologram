import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";

const Header = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <div className="logo-main">
            <FaCamera />
            <span>SoloGram</span>
          </div>
          <div className="tagline">One Voice. Infinite Moments.</div>
        </Logo>

        <MobileMenuIcon onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuIcon>

        <Navigation className={isMenuOpen ? "active" : ""}>
          {isAuthenticated ? (
            <>
              <NavItem>
                <CreatePostButton to="/create">
                  <FaPlus />
                  <span>Create Post</span>
                </CreatePostButton>
              </NavItem>
              <NavItem>
                <NavLink to="/collections">
                  <FaFolder />
                  <span>Collections</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/story-archive">
                  <FaArchive />
                  <span>Story Archive</span>
                </NavLink>
              </NavItem>

              {isAdmin && (
                <NavItem>
                  <NavLink to="/subscribers">
                    <FaBell />
                    <span>Subscribers</span>
                  </NavLink>
                </NavItem>
              )}

              <NavItem>
                <NavLink to="/profile">
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
                <NavLink to="/collections">
                  <FaFolder />
                  <span>Collections</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/login">
                  <FaSignInAlt />
                  <span>Login</span>
                </NavLink>
              </NavItem>
            </>
          )}
        </Navigation>
      </HeaderContent>

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
    </HeaderContainer>
  );
};

const HeaderContainer = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1200px;
  margin: 0 auto;

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
