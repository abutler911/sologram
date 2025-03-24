// components/layout/BottomNavigation.js
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { FaHome, FaFolder, FaSearch, FaBell, FaUser } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  // Helper to check if current path matches or starts with a given path
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <NavContainer>
      <NavItem to="/" active={isActive("/")}>
        <FaHome />
        <NavLabel>Home</NavLabel>
      </NavItem>

      <NavItem to="/collections" active={isActive("/collections")}>
        <FaFolder />
        <NavLabel>Collections</NavLabel>
      </NavItem>

      {isAuthenticated ? (
        <>
          <NavItem to="/story-archive" active={isActive("/story-archive")}>
            <FaBell />
            <NavLabel>Stories</NavLabel>
          </NavItem>

          <NavItem to="/profile" active={isActive("/profile")}>
            <FaUser />
            <NavLabel>Admin</NavLabel>
          </NavItem>
        </>
      ) : (
        <>
          <NavItem to="/about" active={isActive("/about")}>
            <FaSearch />
            <NavLabel>About</NavLabel>
          </NavItem>

          <NavItem
            to="/"
            onClick={() =>
              document.querySelector(".SubscribeBanner button")?.click()
            }
          >
            <FaBell />
            <NavLabel>Subscribe</NavLabel>
          </NavItem>
        </>
      )}
    </NavContainer>
  );
};

const NavContainer = styled.div`
  display: none; /* Hidden by default on larger screens */

  @media (max-width: 767px) {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background-color: #1e1e1e;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    /* Safe area padding for iOS devices */
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
  flex: 1;
  color: ${(props) => (props.active ? "#ff7e5f" : "#aaaaaa")};
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
`;

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: 500;
`;

export default BottomNavigation;
