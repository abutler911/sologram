// client/src/styles/GlobalStyles.js
import { createGlobalStyle } from "styled-components";
import AutographyFont from "../assets/fonts/Autography.otf";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "Autography";
    src: url("/fonts/Autography.woff2") format("woff2"),
         url("/fonts/Autography.woff") format("woff"),
         url("/fonts/Autography.ttf") format("truetype");
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
    background-color: #f8f5f0;
    color: #1a1a1a;
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

    @media (max-width: 767px) {
      padding-bottom: 60px;

      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        padding-bottom: calc(60px + env(safe-area-inset-bottom));
      }
    }
  }

  @media (max-width: 767px) {
    div[class^="FloatingActionButtonContainer"] {
      bottom: 80px !important;
      z-index: 999;
    }
  }

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
    border-top: 4px solid #e98973;
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

  .post-grid-item, .post-card {
    width: 100%;
  }

  @media (max-width: 640px) {
    .post-grid-item, .post-card {
      width: 100% !important;
    }
  }

  @media screen and (display-mode: standalone) {
    body {
      overscroll-behavior: none;
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

export default GlobalStyle;
