import React, { useState, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import {
  FaHome,
  FaSearch,
  FaPlus,
  FaUser,
  FaCamera,
  FaImages,
  FaFolder,
  FaLightbulb,
} from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { COLORS } from "../../theme";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const isActive = (path) => {
    return path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };

  const closeCreateOptions = () => {
    setShowCreateOptions(false);
  };

  return (
    <>
      <NavContainer>
        <NavItem to="/" active={isActive("/")}>
          <FaHome />
        </NavItem>

        <NavItem to="/media-gallery" active={isActive("/media-gallery")}>
          <FaImages />
        </NavItem>

        {isAuthenticated && (
          <CreateButtonWrapper>
            <CreateButton onClick={toggleCreateOptions}>
              <FaPlus />
            </CreateButton>
          </CreateButtonWrapper>
        )}

        <NavItem to="/collections" active={isActive("/collections")}>
          <FaFolder />
        </NavItem>

        {isAuthenticated ? (
          <NavItem to="/profile" active={isActive("/profile")}>
            <UserAvatar active={isActive("/profile")}>
              <FaUser />
            </UserAvatar>
          </NavItem>
        ) : (
          <NavItem to="/login" active={isActive("/login")}>
            <FaUser />
          </NavItem>
        )}
      </NavContainer>

      {showCreateOptions && (
        <CreateOptionsOverlay onClick={closeCreateOptions}>
          <CreateOptionsContainer onClick={(e) => e.stopPropagation()}>
            <CreateOptionsHeader>
              <CreateOptionsTitle>Create</CreateOptionsTitle>
              <CloseButton onClick={closeCreateOptions}>×</CloseButton>
            </CreateOptionsHeader>

            <CreateOptionsList>
              <CreateOptionItem to="/create" onClick={closeCreateOptions}>
                <OptionIcon>
                  <FaCamera />
                </OptionIcon>
                <OptionLabel>Post</OptionLabel>
              </CreateOptionItem>

              <CreateOptionItem to="/create-story" onClick={closeCreateOptions}>
                <OptionIcon>
                  <FaImages />
                </OptionIcon>
                <OptionLabel>Story</OptionLabel>
              </CreateOptionItem>

              <CreateOptionItem
                to="/thoughts/create"
                onClick={closeCreateOptions}
              >
                <OptionIcon>
                  <FaLightbulb />
                </OptionIcon>
                <OptionLabel>Thought</OptionLabel>
              </CreateOptionItem>

              <CreateOptionItem
                to="/collections/create"
                onClick={closeCreateOptions}
              >
                <OptionIcon>
                  <FaFolder />
                </OptionIcon>
                <OptionLabel>Collection</OptionLabel>
              </CreateOptionItem>
            </CreateOptionsList>
          </CreateOptionsContainer>
        </CreateOptionsOverlay>
      )}
    </>
  );
};

const NavContainer = styled.nav`
  display: none;

  @media (max-width: 767px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    background-color: ${COLORS.cardBackground};
    border-top: 1px solid ${COLORS.border};
    padding: 0 16px;
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  font-size: 1.4rem;
  text-decoration: none;
  height: 100%;
  flex: 1;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.buttonHover};
  color: ${(props) => (props.active ? "white" : COLORS.textTertiary)};
  font-size: 0.85rem;
  border: ${(props) => (props.active ? "none" : `1px solid ${COLORS.border}`)};

  &:hover {
    background-color: ${COLORS.primarySalmon};
    color: white;
  }
`;

const CreateButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const CreateButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: ${COLORS.primarySalmon};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;

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
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 1001;
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

const CreateOptionsContainer = styled.div`
  width: 90%;
  max-width: 340px;
  background-color: ${COLORS.cardBackground};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0.5;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const CreateOptionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${COLORS.border};
`;

const CreateOptionsTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${COLORS.textPrimary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  &:hover {
    color: ${COLORS.textPrimary};
  }
`;

const CreateOptionsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: ${COLORS.border};
`;

const CreateOptionItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  text-decoration: none;
  background-color: ${COLORS.cardBackground};
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${COLORS.buttonHover};
  }
`;

const OptionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${COLORS.primarySalmon};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 8px;
`;

const OptionLabel = styled.span`
  color: ${COLORS.textPrimary};
  font-size: 0.9rem;
  font-weight: 500;
`;

export default BottomNavigation;
