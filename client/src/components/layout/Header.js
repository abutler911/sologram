import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCamera, FaUser, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { FaFolder } from 'react-icons/fa';

const Header = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          <FaCamera />
          <span>SoloGram</span>
        </Logo>

        <MobileMenuIcon onClick={toggleMenu}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </MobileMenuIcon>

        <Navigation className={isMenuOpen ? 'active' : ''}>
          {isAuthenticated ? (
            <>
            <NavItem>
  <NavLink to="/collections">
    <FaFolder />
    <span>Collections</span>
  </NavLink>
</NavItem>
              <NavItem>
                <NavLink to="/create">Create Post</NavLink>
              </NavItem>
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
            <NavItem>
              <NavLink to="/login">
                <FaSignInAlt />
                <span>Login</span>
              </NavLink>
            </NavItem>
          )}
        </Navigation>
      </HeaderContent>
    </HeaderContainer>
  );
};

// Styled Components
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
  align-items: center;
  color: #ff7e5f;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  
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

export default Header;