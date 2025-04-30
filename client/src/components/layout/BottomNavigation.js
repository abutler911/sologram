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

  // Only proceed with the admin layout if user is admin
  if (isAdmin) {
    return (
      <NavContainer className="bottom-nav">
        <NavItemsContainer>
          {/* Left section */}
          <NavSection>
            <NavItem to="/" active={isActive("/")}>
              <FaHome />
              <NavLabel>Home</NavLabel>
            </NavItem>
            <NavItem to="/collections" active={isActive("/collections")}>
              <FaFolder />
              <NavLabel>Collections</NavLabel>
            </NavItem>
          </NavSection>

          {/* Center section with floating create button */}
          <CenterSection>
            <CreateButtonWrapper>
              <CreateButton onClick={toggleCreateOptions}>
                <FaPlus />
              </CreateButton>
              {showCreateOptions && (
                <CreateOptionsOverlay
                  onClick={() => setShowCreateOptions(false)}
                >
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

                    <CreateOptionItem
                      to="/collections/create"
                      onClick={() => setShowCreateOptions(false)}
                    >
                      <FaFolder />
                      <span>New Collection</span>
                    </CreateOptionItem>

                    <CreateOptionItem
                      to="/media-gallery"
                      onClick={() => setShowCreateOptions(false)}
                    >
                      <FaImages />
                      <span>Media Gallery</span>
                    </CreateOptionItem>
                  </CreateOptions>
                </CreateOptionsOverlay>
              )}
            </CreateButtonWrapper>
          </CenterSection>

          {/* Right section */}
          <NavSection>
            <NavItem to="/thoughts" active={isActive("/thoughts")}>
              <FaLightbulb />
              <NavLabel>Thoughts</NavLabel>
            </NavItem>
            <NavItem to="/media-gallery" active={isActive("/media-gallery")}>
              <FaImages />
              <NavLabel>Media</NavLabel>
            </NavItem>
          </NavSection>
        </NavItemsContainer>
      </NavContainer>
    );
  }

  // Non-admin view
  return (
    <NavContainer className="bottom-nav">
      {!isAuthenticated && <BrandBackground>SOLOGRAM</BrandBackground>}

      <NavItemsContainer>
        <NavItem to="/" active={isActive("/")}>
          <FaHome />
          <NavLabel>Home</NavLabel>
        </NavItem>
        <NavItem to="/collections" active={isActive("/collections")}>
          <FaFolder />
          <NavLabel>Collections</NavLabel>
        </NavItem>
        <NavItem to="/thoughts" active={isActive("/thoughts")}>
          <FaLightbulb />
          <NavLabel>Thoughts</NavLabel>
        </NavItem>
      </NavItemsContainer>
    </NavContainer>
  );
};

// Styling

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
    height: 64px;
    background-color: ${COLORS.elevatedBackground};
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 0);
    overflow: visible; /* Allow the create button to overflow */
  }
`;

// Container for nav items to ensure they're above the brand background
const NavItemsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2;
  padding: 0 12px;
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

// Section for left and right sides
const NavSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

// Center section for create button
const CenterSection = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  width: 80px;
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  text-decoration: none;
  position: relative;
  z-index: 3;
  transition: color 0.2s ease;

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
    transition: transform 0.2s ease;
  }

  &:hover {
    color: ${COLORS.primarySalmon};
  }

  &:active svg {
    transform: scale(0.9);
  }
`;

const NavLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
`;

// Updated styled components for the floating Create button
const CreateButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  bottom: 4px;
  z-index: 10;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(255, 100, 100, 0.3);
  transform: translateY(-10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background: linear-gradient(
      135deg,
      ${COLORS.accentSalmon},
      ${COLORS.primarySalmon}
    );
    transform: translateY(-12px);
    box-shadow: 0 5px 15px rgba(255, 100, 100, 0.4);
  }

  &:active {
    transform: translateY(-8px) scale(0.95);
    box-shadow: 0 2px 8px rgba(255, 100, 100, 0.3);
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
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const CreateOptions = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 16px;
  overflow: hidden;
  width: 80%;
  max-width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
  transform-origin: bottom center;

  @keyframes slideUp {
    from {
      transform: translateY(50px) scale(0.9);
      opacity: 0.5;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const CreateOptionItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 16px;
  color: ${COLORS.textPrimary};
  text-decoration: none;
  border-bottom: 1px solid ${COLORS.divider};
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  svg {
    margin-right: 12px;
    font-size: 1.2rem;
    color: ${COLORS.primaryBlueGray};
    transition: color 0.2s ease, transform 0.2s ease;
  }

  &:hover {
    background-color: ${COLORS.buttonHover};
  }

  &:hover svg {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

export default BottomNavigation;
