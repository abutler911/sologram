import React, { useState, useEffect, useRef, useContext } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";

import { AuthContext } from "./context/AuthContext";
import { initOneSignal, subscribeToPush } from "./utils/oneSignal";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/pwa/InstallPrompt";
import FloatingActionButtonAdjuster from "./components/layout/FloatingActionButtonAdjuster";
import AppRoutes from "./AppRoutes";

// Register service worker just once
serviceWorkerRegistration.register();

const PageTracker = () => {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
  }, [location]);
  return null;
};

const OfflineIndicator = styled.div`
  background-color: #f8d7da;
  color: #721c24;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 1001;
`;

function App() {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const homeRef = useRef(null);
  const { user } = useContext(AuthContext);

  // ✅ Network listener
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (networkStatus && localStorage.getItem("wasOffline") === "true") {
      toast.success("You are back online");
      localStorage.removeItem("wasOffline");
    } else if (!networkStatus) {
      localStorage.setItem("wasOffline", "true");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [networkStatus]);

  useEffect(() => {
    if (!user?._id) return;

    console.log("[OneSignal] Init triggered with userId:", user._id);

    const setupNotifications = async () => {
      try {
        // If OneSignal is already initialized, don't reinitialize
        if (window.OneSignal?.initialized) {
          console.log("[OneSignal] Already initialized");
          return;
        }

        const ready = await initOneSignal(user._id);

        // We don't want to automatically prompt for permission here
        // Let the SubscribeBanner handle that
        if (ready) {
          // Just check if already subscribed
          const isSubscribed =
            await window.OneSignal.isPushNotificationsEnabled();
          console.log("[OneSignal] User subscription status:", isSubscribed);

          // Set a flag to prevent duplicate initialization
          window.OneSignal.initialized = true;
        }
      } catch (error) {
        console.error("[OneSignal] Setup error:", error);
      }
    };

    setupNotifications();
  }, [user?._id]);

  // 🔍 Search handlers
  const handleSearch = (query) => {
    homeRef.current?.handleHeaderSearch?.(query);
  };

  const handleClearSearch = () => {
    homeRef.current?.clearSearch?.();
  };

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <PageTracker />
        <div className="app">
          <Toaster position="top-right" />
          {!networkStatus && (
            <OfflineIndicator>
              You are currently offline. Some features may be limited.
            </OfflineIndicator>
          )}
          <AppRoutes
            user={user}
            homeRef={homeRef}
            handleSearch={handleSearch}
            handleClearSearch={handleClearSearch}
          />
          <InstallPrompt />
          <FloatingActionButtonAdjuster />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
