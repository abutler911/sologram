import React, { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import AppNav from "../navigation/AppNav";
import Footer from "./Footer";

import styled from "styled-components";
import { COLORS } from "../../theme";
import LoadingSpinner from "../common/LoadingSpinner";

const InstallPrompt = lazy(() => import("../pwa/InstallPrompt"));
const FloatingActionButtonAdjuster = lazy(() =>
  import("./FloatingActionButtonAdjuster")
);

const MainLayout = ({
  children,
  noNav = false,
  noFooter = false,
  customHeader = null,
  customFooter = null,
  customBanner = null,
  isLoading = false,
  onSearch,
  onClearSearch,
}) => {
  return (
    <LayoutWrapper>
      {!noNav &&
        (customHeader || (
          <AppNav onSearch={onSearch} onClearSearch={onClearSearch} />
        ))}
      <main aria-label="Main Content">
        {isLoading ? <LoadingSpinner /> : children}
      </main>
      {!noFooter && (customFooter || <Footer />)}
      <Suspense fallback={<div>Loading...</div>}>
        <InstallPrompt />
        <FloatingActionButtonAdjuster />
      </Suspense>
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${COLORS.background};
  transition: background-color 0.3s ease-in-out;
  width: 100%;
  overflow-x: hidden; /* Prevent horizontal scrolling */

  @media (min-width: 768px) {
    .bottom-navigation {
      display: none;
    }
  }

  main {
    --app-max-width: 470px;

    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin: 0; /* Remove top margin */
    padding: 0; /* Remove all padding for seamless transition */
    box-sizing: border-box;

    > * {
      width: min(100%, var(--app-max-width));
      margin-left: auto;
      margin-right: auto;
    }

    /* Special handling for home feed - no padding */
    &[data-page="home"] {
      padding: 0;

      & > div {
        padding: 0;
      }
    }
  }
`;

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  noNav: PropTypes.bool,
  noFooter: PropTypes.bool,
  customHeader: PropTypes.node,
  customFooter: PropTypes.node,
  customBanner: PropTypes.node,
  isLoading: PropTypes.bool,
  onSearch: PropTypes.func,
  onClearSearch: PropTypes.func,
};

export default MainLayout;
