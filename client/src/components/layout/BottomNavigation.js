/* global OneSignal */

import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { FaHome, FaFolder, FaSearch, FaBell, FaUser } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const isActive = (path) => {
    return path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);
  };

  const handleSubscribeClick = async () => {
    if (!window.OneSignal) {
      toast.error(
        "Push notifications not available yet. Please try again shortly."
      );
      return;
    }

    const OneSignal = window.OneSignal;

    try {
      const isPushSupported = await OneSignal.isPushNotificationsSupported();
      if (!isPushSupported) {
        toast.error("Push notifications are not supported on this device.");
        return;
      }

      const permission = await OneSignal.getNotificationPermission();
      if (permission === "granted") {
        const isSubscribed = await OneSignal.isPushNotificationsEnabled();
        if (isSubscribed) {
          toast.success("You're already subscribed to notifications!");
        } else {
          await OneSignal.subscribe();
          toast.success("Subscribed to notifications!");
        }
      } else {
        // Ask for permission & subscribe
        await OneSignal.registerForPushNotifications();
        toast.success("Subscribed to notifications!");
      }
    } catch (err) {
      console.error("Failed to subscribe:", err);
      toast.error("Subscription failed. Please try again.");
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

          <SubscribeButton onClick={handleSubscribeClick}>
            <FaBell />
            <span>Subscribe</span>
          </SubscribeButton>
        </>
      )}
    </NavContainer>
  );
};

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

const SubscribeButton = styled.button`
  all: unset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

const NavLabel = styled.span`
  font-size: 0.625rem;
  font-weight: 500;
`;

export default BottomNavigation;
