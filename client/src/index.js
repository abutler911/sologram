import React from "react";
import ReactDOM from "react-dom/client";
import { createGlobalStyle } from "styled-components";
import App from "./App";
import axios from "axios";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

// Set default axios baseURL
// In production, you would set this to your actual API URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || "";

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Create a UI to notify users about the update
    const updateAvailable = document.createElement("div");
    updateAvailable.id = "update-notification";
    updateAvailable.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
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
        <button style="
          background-color: #ff7e5f;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          margin-left: 16px;
        " onclick="window.location.reload()">
          Update
        </button>
      </div>
    `;
    document.body.appendChild(updateAvailable);
  },
});
