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
    if (path === "/") {
      return location.pathname === "/" && !location.search.includes("search");
    }
    return location.pathname.startsWith(path);
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
          <NavIcon active={isActive("/")}>
            <FaHome />
          </NavIcon>
          <NavLabel active={isActive("/")}>Home</NavLabel>
        </NavItem>

        <NavItem to="/thoughts" active={isActive("/thoughts")}>
          <NavIcon active={isActive("/thoughts")}>
            <FaLightbulb />
          </NavIcon>
          <NavLabel active={isActive("/thoughts")}>Thoughts</NavLabel>
        </NavItem>

        {isAuthenticated && (
          <CreateButtonWrapper>
            <CreateButton
              onClick={toggleCreateOptions}
              active={showCreateOptions}
            >
              <FaPlus />
            </CreateButton>
          </CreateButtonWrapper>
        )}

        <NavItem to="/media-gallery" active={isActive("/media-gallery")}>
          <NavIcon active={isActive("/media-gallery")}>
            <FaImages />
          </NavIcon>
          <NavLabel active={isActive("/media-gallery")}>Gallery</NavLabel>
        </NavItem>

        {isAuthenticated ? (
          <NavItem to="/profile" active={isActive("/profile")}>
            <UserAvatar active={isActive("/profile")}>
              <FaUser />
            </UserAvatar>
            <NavLabel active={isActive("/profile")}>Profile</NavLabel>
          </NavItem>
        ) : (
          <NavItem to="/login" active={isActive("/login")}>
            <NavIcon active={isActive("/login")}>
              <FaUser />
            </NavIcon>
            <NavLabel active={isActive("/login")}>Login</NavLabel>
          </NavItem>
        )}
      </NavContainer>

      {showCreateOptions && (
        <CreateOptionsOverlay onClick={closeCreateOptions}>
          <CreateOptionsContainer onClick={(e) => e.stopPropagation()}>
            <CreateOptionsHeader>
              <CreateOptionsTitle>Create Something</CreateOptionsTitle>
              <CloseButton onClick={closeCreateOptions}>×</CloseButton>
            </CreateOptionsHeader>

            <CreateOptionsList>
              <CreateOptionItem to="/create" onClick={closeCreateOptions}>
                <OptionIcon variant="post">
                  <FaCamera />
                </OptionIcon>
                <OptionContent>
                  <OptionLabel>Post</OptionLabel>
                  <OptionDescription>Share photos & videos</OptionDescription>
                </OptionContent>
              </CreateOptionItem>

              <CreateOptionItem to="/create-story" onClick={closeCreateOptions}>
                <OptionIcon variant="story">
                  <FaImages />
                </OptionIcon>
                <OptionContent>
                  <OptionLabel>Story</OptionLabel>
                  <OptionDescription>Temporary moments</OptionDescription>
                </OptionContent>
              </CreateOptionItem>

              <CreateOptionItem
                to="/thoughts/create"
                onClick={closeCreateOptions}
              >
                <OptionIcon variant="thought">
                  <FaLightbulb />
                </OptionIcon>
                <OptionContent>
                  <OptionLabel>Thought</OptionLabel>
                  <OptionDescription>Share your ideas</OptionDescription>
                </OptionContent>
              </CreateOptionItem>

              <CreateOptionItem
                to="/collections/create"
                onClick={closeCreateOptions}
              >
                <OptionIcon variant="collection">
                  <FaFolder />
                </OptionIcon>
                <OptionContent>
                  <OptionLabel>Collection</OptionLabel>
                  <OptionDescription>Organize content</OptionDescription>
                </OptionContent>
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

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70px;
    background: linear-gradient(
      180deg,
      ${COLORS.cardBackground}95 0%,
      ${COLORS.cardBackground} 50%
    );
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid ${COLORS.border};
    padding: 0 8px;
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom, 8px);
    box-shadow: 0 -4px 16px ${COLORS.shadow};
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  flex: 1;
  padding: 8px 4px;
  transition: all 0.2s ease;
  border-radius: 12px;
  position: relative;

  &:hover {
    background-color: ${COLORS.primarySalmon}10;
  }

  ${(props) =>
    props.active &&
    `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: linear-gradient(90deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon});
      border-radius: 0 0 3px 3px;
    }
  `}
`;

const NavIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  font-size: 1.2rem;
  margin-bottom: 2px;
  transition: all 0.2s ease;
  transform: ${(props) => (props.active ? "scale(1.1)" : "scale(1)")};

  ${NavItem}:hover & {
    color: ${COLORS.primarySalmon};
    transform: scale(1.1);
  }
`;

const NavLabel = styled.span`
  color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.textTertiary};
  font-size: 0.65rem;
  font-weight: ${(props) => (props.active ? "600" : "500")};
  text-align: center;
  transition: all 0.2s ease;
  font-family: "Inter", sans-serif;

  ${NavItem}:hover & {
    color: ${COLORS.primarySalmon};
    font-weight: 600;
  }
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.active
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`
      : COLORS.buttonHover};
  color: ${(props) => (props.active ? "white" : COLORS.textTertiary)};
  font-size: 0.7rem;
  border: ${(props) => (props.active ? "none" : `1px solid ${COLORS.border}`)};
  margin-bottom: 2px;
  transition: all 0.2s ease;
  box-shadow: ${(props) =>
    props.active ? `0 2px 8px ${COLORS.primarySalmon}30` : "none"};

  ${NavItem}:hover & {
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon},
      ${COLORS.accentSalmon}
    );
    color: white;
    transform: scale(1.1);
    box-shadow: 0 2px 8px ${COLORS.primarySalmon}30;
  }
`;

const CreateButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 4px;
`;

const CreateButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: ${(props) =>
    props.active
      ? `linear-gradient(135deg, ${COLORS.accentSalmon}, ${COLORS.primarySalmon})`
      : `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}30;
  margin-bottom: 2px;
  transform: ${(props) =>
    props.active ? "rotate(45deg) scale(1.1)" : "rotate(0deg) scale(1)"};

  &:hover {
    transform: ${(props) =>
      props.active ? "rotate(45deg) scale(1.2)" : "rotate(0deg) scale(1.1)"};
    box-shadow: 0 6px 16px ${COLORS.primarySalmon}40;
  }

  &:active {
    transform: ${(props) =>
      props.active ? "rotate(45deg) scale(1.05)" : "rotate(0deg) scale(0.95)"};
  }
`;

const CreateOptionsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.8) 100%
  );
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

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
  max-width: 360px;
  background: linear-gradient(
    135deg,
    ${COLORS.cardBackground}95 0%,
    ${COLORS.cardBackground} 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px ${COLORS.border};
  animation: slideUp 0.3s ease;
  margin-bottom: 80px; /* Account for bottom nav */

  @keyframes slideUp {
    from {
      transform: translateY(40px) scale(0.9);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const CreateOptionsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon}08 0%,
    ${COLORS.primaryMint}05 100%
  );
  border-bottom: 1px solid ${COLORS.border};
`;

const CreateOptionsTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  font-family: "Inter", sans-serif;
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
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: ${COLORS.textPrimary};
    background-color: ${COLORS.buttonHover};
    transform: scale(1.1);
  }
`;

const CreateOptionsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background-color: ${COLORS.border};
  padding: 0;
`;

const CreateOptionItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  text-decoration: none;
  background-color: ${COLORS.cardBackground};
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon}08 0%,
      ${COLORS.primaryMint}05 100%
    );
    transform: translateY(-2px);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      ${COLORS.primarySalmon}15 0%,
      ${COLORS.primaryMint}10 100%
    );
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::before {
    opacity: 1;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const OptionIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  margin-bottom: 12px;
  transition: all 0.2s ease;

  ${(props) => {
    switch (props.variant) {
      case "post":
        return `
          background: linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon});
          color: white;
        `;
      case "story":
        return `
          background: linear-gradient(135deg, ${COLORS.primaryMint}, ${COLORS.primaryBlueGray});
          color: white;
        `;
      case "thought":
        return `
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: white;
        `;
      case "collection":
        return `
          background: linear-gradient(135deg, ${COLORS.primaryBlueGray}, ${COLORS.primaryMint});
          color: white;
        `;
      default:
        return `
          background: linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon});
          color: white;
        `;
    }
  }}

  ${CreateOptionItem}:hover & {
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const OptionContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const OptionLabel = styled.span`
  color: ${COLORS.textPrimary};
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 2px;
  font-family: "Inter", sans-serif;
`;

const OptionDescription = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  line-height: 1.2;
`;

export default BottomNavigation;
