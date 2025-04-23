import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import { initOneSignal, subscribeToPush } from "./utils/oneSignal";

import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/pwa/InstallPrompt";
import FloatingActionButtonAdjuster from "./components/layout/FloatingActionButtonAdjuster";

import { AuthProvider } from "./context/AuthContext";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import AppRoutes from "./AppRoutes";

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

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (networkStatus) {
      if (localStorage.getItem("wasOffline") === "true") {
        toast.success("You are back online");
        localStorage.removeItem("wasOffline");
      }
    } else {
      localStorage.setItem("wasOffline", "true");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [networkStatus]);
  useEffect(() => {
    if (user?._id) {
      initOneSignal(user._id);
      subscribeToPush();
    }
  }, [user]);
  const handleSearch = (query) => {
    if (homeRef.current?.handleHeaderSearch) {
      homeRef.current.handleHeaderSearch(query);
    }
  };

  const handleClearSearch = () => {
    if (homeRef.current?.clearSearch) {
      homeRef.current.clearSearch();
    }
  };

  return (
    <AuthProvider>
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
              homeRef={homeRef}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
            />
            <InstallPrompt />
            <FloatingActionButtonAdjuster />
          </div>
        </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
