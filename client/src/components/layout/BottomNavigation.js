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
import { subscribeToNotifications } from "../../utils/notificationService";
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

  const handleSubscribeClick = async () => {
    const loadingToast = toast.loading("Preparing notifications...");

    try {
      const result = await subscribeToNotifications();
      toast.dismiss(loadingToast);

      if (result) {
        toast.success("Subscribed to notifications!");

        localStorage.setItem("subscribeBannerDismissed", "true");
        localStorage.setItem(
          "subscribeBannerDismissedAt",
          Date.now().toString()
        );
      } else {
        toast.error("Unable to subscribe. Check your browser settings.");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Subscription error:", error);
      toast.error("Something went wrong. Try again later.");
    }
  };

  const toggleCreateOptions = () => {
    setShowCreateOptions(!showCreateOptions);
  };

  return (
    <NavContainer className="bottom-nav">
      {/* Left side: 2 icons */}
      <NavItem to="/" active={isActive("/")}>
        <FaHome />
        <NavLabel>Home</NavLabel>
      </NavItem>

      <NavItem to="/collections" active={isActive("/collections")}>
        <FaFolder />
        <NavLabel>Collections</NavLabel>
      </NavItem>

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
                    <CreateOptionItem
                      to="/subscribers"
                      onClick={() => setShowCreateOptions(false)}
                    >
                      <FaUsers />
                      <span>Manage Subscribers</span>
                    </CreateOptionItem>
                  </>
                )}
              </CreateOptions>
            </CreateOptionsOverlay>
          )}
        </CreateButtonWrapper>
      )}

      {/* Center brand for non-authenticated users */}
      {!isAuthenticated && (
        <BrandCenter>
          <BrandText>SoloGram</BrandText>
        </BrandCenter>
      )}

      {/* Right side: 2 icons */}
      <NavItem to="/thoughts" active={isActive("/thoughts")}>
        <FaLightbulb />
        <NavLabel>Thoughts</NavLabel>
      </NavItem>

      {/* Admin button for authenticated users, Subscribe button for non-authenticated users */}
      {isAuthenticated ? (
        <NavItem to="/admin" active={isActive("/admin")}>
          <FaUser />
          <NavLabel>Admin</NavLabel>
        </NavItem>
      ) : (
        <NavAction onClick={handleSubscribeClick}>
          <FaBell />
          <NavLabel>Subscribe</NavLabel>
        </NavAction>
      )}
    </NavContainer>
  );
};

const NavAction = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0;
  flex: 1;
  color: ${COLORS.textTertiary};
  cursor: pointer;

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const NavContainer = styled.div`
  display: none;

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
  }
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

const BrandCenter = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const BrandText = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.primarySalmon};
  letter-spacing: 0.5px;
  user-select: none;
  animation: pulse 2.8s ease-in-out infinite;
  opacity: 0.9;

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.9;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.9;
    }
  }
`;

export default BottomNavigation;
