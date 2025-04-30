import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaHome,
  FaFolder,
  FaBell,
  FaUser,
  FaPlus,
  FaCamera,
  FaImages,
  FaUsers,
  FaLightbulb,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

import { COLORS } from "../../theme";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const isAdmin = isAuthenticated && user && user.role === "admin";

  const isActive = (path) => {
    return path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };

  // Define the navigation items based on user role
  const getNavItems = () => {
    // Common nav items for all users
    const navItems = [
      {
        to: "/",
        icon: <FaHome />,
        label: "Home",
      },
      {
        to: "/collections",
        icon: <FaFolder />,
        label: "Collections",
      },
      {
        to: "/thoughts",
        icon: <FaLightbulb />,
        label: "Thoughts",
      },
    ];

    // Add media gallery link for admin users
    if (isAdmin) {
      navItems.push({
        to: "/media-gallery",
        icon: <FaImages />,
        label: "Media",
      });
    }

    return navItems;
  };

  const navItems = getNavItems();

  return (
    <NavContainer className="bottom-nav">
      {/* Background brand for non-authenticated users */}
      {!isAuthenticated && <BrandBackground>SOLOGRAM</BrandBackground>}

      {/* Navigation Items */}
      <NavItemsContainer>
        {/* Left side nav items */}
        {navItems.map((item, index) => (
          <NavItem key={item.to} to={item.to} active={isActive(item.to)}>
            {item.icon}
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}

        {/* Center create button - only for admin users */}
        {isAdmin && (
          <CreateButtonWrapper>
            <CreateButton onClick={toggleCreateOptions}>
              <FaPlus />
            </CreateButton>
            <NavLabel style={{ opacity: 0 }}>Create</NavLabel>
            {showCreateOptions && (
              <CreateOptionsOverlay onClick={() => setShowCreateOptions(false)}>
                <CreateOptions onClick={(e) => e.stopPropagation()}>
                  <CreateOptionItem
                    to="/create"
                    onClick={() => setShowCreateOptions(false)}
                  >
                    <FaCamera />
                    <span>New Post</span>
                  </CreateOptionItem>

                  <CreateOptionItem
                    to="/create-story"
                    onClick={() => setShowCreateOptions(false)}
                  >
                    <FaImages />
                    <span>New Story</span>
                  </CreateOptionItem>

                  {isAdmin && (
                    <>
                      <CreateOptionItem
                        to="/collections/create"
                        onClick={() => setShowCreateOptions(false)}
                      >
                        <FaFolder />
                        <span>New Collection</span>
                      </CreateOptionItem>
                    </>
                  )}
                  {isAdmin && (
                    <CreateOptionItem
                      to="/media-gallery"
                      onClick={() => setShowCreateOptions(false)}
                    >
                      <FaImages />
                      <span>Media Gallery</span>
                    </CreateOptionItem>
                  )}
                </CreateOptions>
              </CreateOptionsOverlay>
            )}
          </CreateButtonWrapper>
        )}
      </NavItemsContainer>
    </NavContainer>
  );
};

const NavContainer = styled.div`
  display: none;
  position: relative;

  @media (max-width: 767px) {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px; /* Slightly increased for better touchability */
    background-color: ${COLORS.elevatedBackground};
    box-shadow: 0 -2px 8px ${COLORS.shadow};
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 0);
    overflow: hidden;
  }
`;

// Container for nav items to ensure they're above the brand background
const NavItemsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
`;

// Brand background that spans the entire navbar for unauthenticated users
const BrandBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  opacity: 0.15;
  letter-spacing: 2px;
  user-select: none;
  z-index: 1;
  pointer-events: none;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
  flex: 1;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  text-decoration: none;
  position: relative;
  z-index: 3;

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: 500;
`;

// Updated styled components for the integrated Create button
const CreateButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
  position: relative;
  margin-top: -20px; /* Move button up to be partially above the navbar */
  z-index: 3;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: ${COLORS.primarySalmon};
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  margin-bottom: 0.125rem;

  &:hover {
    background-color: ${COLORS.accentSalmon};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CreateOptionsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CreateOptions = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  width: 80%;
  max-width: 300px;
  box-shadow: 0 4px 12px ${COLORS.shadow};
  border: 1px solid ${COLORS.border};
`;

const CreateOptionItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 16px;
  color: ${COLORS.textPrimary};
  text-decoration: none;
  border-bottom: 1px solid ${COLORS.divider};

  &:last-child {
    border-bottom: none;
  }

  svg {
    margin-right: 12px;
    font-size: 1.2rem;
    color: ${COLORS.primaryBlueGray};
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
  }
`;

export default BottomNavigation;
