// client/src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";
import axios from "axios";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { initializeOneSignal } from "./utils/oneSignal";
import ReactGA from "react-ga4";

import CustomFont from "./assets/fonts/Paradise-Signature.otf";

// Initialize GA4 with your measurement ID
if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID, {
    testMode: process.env.REACT_APP_GA_TEST_MODE === "true",
  });
}

// Set default axios baseURL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "";

// Initialize OneSignal with a delay to ensure DOM is fully loaded
setTimeout(() => {
  initializeOneSignal().catch((err) =>
    console.error("OneSignal initialization error:", err)
  );
}, 2000);

// Global styles
const GlobalStyle = createGlobalStyle`

@font-face {
    font-family: 'ParadiseSignature'; 
    src: url(${CustomFont}) format('opentype');
    font-weight: normal;
    font-style: normal;
    font-display: swap; 
  }


  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f7f7f7;
    color: #333333;
  }

  html, body {
    height: 100%;
  }
  
  #root {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .main-content {
    flex: 1;
    
    /* Add padding to prevent content from being hidden behind bottom nav on mobile */
    @media (max-width: 767px) {
      padding-bottom: 60px; /* Slightly more than the height of the bottom nav */
      
      /* Add extra padding for iOS devices with notch */
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        padding-bottom: calc(60px + env(safe-area-inset-bottom));
      }
    }
  }
  
  /* Adjust the floating action button position on mobile to account for bottom nav */
  @media (max-width: 767px) {
  div[class^="FloatingActionButtonContainer"] {
    bottom: 80px !important; /* Position above bottom nav */
    z-index: 999; /* Ensure it's above other elements */
  }
}
  
  /* Hide bottom nav when keyboard is visible */
  @media screen and (max-height: 450px) {
    .bottom-nav {
      display: none;
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }
  
  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ff7e5f;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  .filter-warm {
    filter: saturate(1.5) sepia(0.2) contrast(1.1);
  }

  .filter-cool {
    filter: saturate(0.9) hue-rotate(30deg) brightness(1.1);
  }

  .filter-grayscale {
    filter: grayscale(1);
  }

  .filter-vintage {
    filter: sepia(0.4) saturate(1.3) contrast(1.2);
  }

  .post-grid-item {
    width: 100%;
  }
  
  .post-card {
    width: 100%;
  }
  
  @media (max-width: 640px) {
    .post-grid-item {
      width: 100% !important;
    }
    
    .post-card {
      width: 100% !important;
    }
  }
  
  @media screen and (display-mode: standalone) {
    body {
      /* Prevent overscroll bounce */
      overscroll-behavior: none;
      /* Fix for the CSS warning */
      overscroll-behavior-y: contain;
    }
    
    .app {
       display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GlobalStyle />
    <App />
  </React.StrictMode>
);

// Register service worker AFTER OneSignal has a chance to register its own
const registerServiceWorker = () => {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Only show notification if there's actually a new service worker waiting
      if (!registration || !registration.waiting) {
        console.log(
          "[PWA] Update callback triggered but no waiting worker found"
        );
        return;
      }

      // Better version detection logic - hash the scriptURL
      // This is more reliable than comparing URLs directly
      const getScriptHash = (url) => {
        // Extract just the hash part of the URL which changes when the content changes
        const urlParts = url.split("/");
        return urlParts[urlParts.length - 1];
      };

      const newVersion = getScriptHash(registration.waiting.scriptURL);
      const currentVersion = getScriptHash(
        registration.active?.scriptURL || ""
      );

      // Skip notification if it's the same version
      if (newVersion === currentVersion) {
        console.log(
          "[PWA] Same version detected, skipping update notification"
        );
        return;
      }

      console.log(
        `[PWA] New version detected: ${newVersion} vs current: ${currentVersion}`
      );

      // Prevent duplicate notifications
      if (document.getElementById("update-notification")) {
        return;
      }

      // Create update notification UI
      const updateAvailable = document.createElement("div");
      updateAvailable.id = "update-notification";
      updateAvailable.innerHTML = `
        <div style="
          position: fixed;
          bottom: 76px;
          right: 20px;
          background-color: #4a4a4a;
          color: white;
          border-radius: 4px;
          padding: 16px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 9999;
          max-width: 320px;
        ">
          <div>
            <p style="margin: 0 0 8px 0; font-weight: bold;">Update Available</p>
            <p style="margin: 0; font-size: 14px;">Refresh to see the latest version.</p>
          </div>
          <button id="update-app-button" style="
            background-color: #ff7e5f;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            cursor: pointer;
            margin-left: 16px;
          ">
            Update
          </button>
        </div>
      `;

      // Add to body
      document.body.appendChild(updateAvailable);

      // Set up controller change listener BEFORE adding button click handler
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (window.__refreshing) return;
        window.__refreshing = true;
        console.log("[PWA] Service worker controller changed, reloading page");
        window.location.reload();
      });

      // Set up a global flag to track refresh status
      window.__refreshing = false;

      // Add event listener to the update button
      document
        .getElementById("update-app-button")
        .addEventListener("click", () => {
          console.log("[PWA] Update button clicked");

          // Remove the notification
          if (updateAvailable.parentNode) {
            updateAvailable.parentNode.removeChild(updateAvailable);
          }

          // Tell the service worker to skip waiting and activate
          if (registration && registration.waiting) {
            console.log("[PWA] Sending SKIP_WAITING message to waiting worker");
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
    },
  });
};

// Call the service worker registration after a short delay to give OneSignal time to initialize
setTimeout(() => {
  registerServiceWorker();
}, 3000);
