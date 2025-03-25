import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { FaHome, FaFolder, FaSearch, FaBell, FaUser } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  requestNotificationPermission,
  isOneSignalReady,
} from "../../utils/oneSignal";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const isActive = (path) => {
    return path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
  };

  const handleSubscribeClick = async () => {
    // Show loading toast while we check OneSignal
    const loadingToast = toast.loading("Preparing subscription...");

    try {
      // Check if OneSignal is ready
      if (!isOneSignalReady()) {
        // Wait a bit for OneSignal to initialize
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Check again
        if (!isOneSignalReady()) {
          toast.error(
            "Push notifications not available. Please try again later."
          );
          toast.dismiss(loadingToast);
          return;
        }
      }

      // Dismiss the loading toast
      toast.dismiss(loadingToast);

      // Request notification permission
      const result = await requestNotificationPermission();

      if (result) {
        toast.success("Successfully subscribed to notifications!");
      } else {
        // Check the current permission
        const permission = await window.OneSignal.getNotificationPermission();

        if (permission === "denied") {
          toast.error(
            "Notifications are blocked. Please update your browser settings to allow notifications."
          );
        } else {
          toast("You can subscribe to notifications anytime.");
        }
      }
    } catch (err) {
      console.error("Error in handleSubscribeClick:", err);
      toast.dismiss(loadingToast);
      toast.error("There was a problem subscribing to notifications.");
    }
  };

  return (
    <NavContainer className="bottom-nav">
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

          <NavAction onClick={handleSubscribeClick}>
            <FaBell />
            <NavLabel>Subscribe</NavLabel>
          </NavAction>
        </>
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
  color: #aaaaaa;
  cursor: pointer;

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  &:hover {
    color: #ff7e5f;
  }
`;

const NavContainer = styled.div`
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

  svg {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  &:hover {
    color: #ff7e5f;
  }
`;

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: 500;
`;

export default BottomNavigation;
