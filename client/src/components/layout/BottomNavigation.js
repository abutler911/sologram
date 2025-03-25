import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { FaHome, FaFolder, FaSearch, FaBell, FaUser } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { requestNotificationPermission } from "../../utils/oneSignal";

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
      // Check if OneSignal is available in window object
      if (!window.OneSignal) {
        // Try again after a short delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (!window.OneSignal) {
          toast.dismiss(loadingToast);
          toast.error(
            "Notification service isn't ready yet. Please try again in a moment."
          );
          return;
        }
      }

      // Dismiss the loading toast
      toast.dismiss(loadingToast);

      // Check if native API is available (fallback)
      const useNativeAPI =
        !window.OneSignal.showSlidedownPrompt &&
        "Notification" in window &&
        Notification.permission !== "denied";

      if (useNativeAPI) {
        // Use the browser's native notification API as fallback
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          toast.success("Successfully subscribed to notifications!");
        } else {
          toast(
            "You can enable notifications anytime from your browser settings."
          );
        }
        return;
      }

      // Try using OneSignal API
      try {
        if (typeof window.OneSignal.showSlidedownPrompt === "function") {
          await window.OneSignal.showSlidedownPrompt();
          toast.success("Successfully subscribed to notifications!");
        } else if (
          typeof window.OneSignal.registerForPushNotifications === "function"
        ) {
          await window.OneSignal.registerForPushNotifications();
          toast.success("Successfully subscribed to notifications!");
        } else {
          // Try using our helper function
          const result = await requestNotificationPermission();
          if (result) {
            toast.success("Successfully subscribed to notifications!");
          } else {
            toast("You can subscribe to notifications anytime.");
          }
        }
      } catch (oneSignalError) {
        console.error("OneSignal specific error:", oneSignalError);
        toast.error("There was a problem subscribing to notifications.");
      }
    } catch (err) {
      console.error("Error in handleSubscribeClick:", err);
      toast.dismiss(loadingToast);
      toast.error("There was a problem with the notification system.");
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
