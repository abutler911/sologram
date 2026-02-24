// client/src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';
import { COLORS } from '../theme';

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

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
      "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
      "Helvetica Neue", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${COLORS.background};
    color: ${COLORS.textPrimary};
    line-height: 1.5;
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

  /* Image filters — used by PostCard via className */
  .filter-warm     { filter: saturate(1.2) sepia(0.15) contrast(1.05); }
  .filter-cool     { filter: saturate(0.9) hue-rotate(10deg) brightness(1.05); }
  .filter-grayscale{ filter: grayscale(0.9); }
  .filter-vintage  { filter: sepia(0.35) saturate(1.3) contrast(1.1); }
  .filter-clarendon{ filter: contrast(1.2) saturate(1.35); }
  .filter-gingham  { filter: brightness(1.05) sepia(0.2); }
  .filter-moon     { filter: grayscale(1) brightness(1.1) contrast(1.1); }

  /* PWA overscroll */
  @media screen and (display-mode: standalone) {
    body {
      overscroll-behavior: none;
      overscroll-behavior-y: contain;
    }
  }
`;

export default GlobalStyle;
