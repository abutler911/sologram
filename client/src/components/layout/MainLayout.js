import React, { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Header from "./Header";
import Footer from "./Footer";
import BottomNavigation from "./BottomNavigation";

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
}) => {
  return (
    <LayoutWrapper>
      {customHeader || <Header />}
      <main aria-label="Main Content">
        {isLoading ? <LoadingSpinner /> : children}
      </main>
      {!noFooter && (customFooter || <Footer />)}
      {!noNav && <BottomNavigation />}
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
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 1rem; /* Add some space between header and content */
    padding: 0 1rem; /* Add side padding for content */
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
};

export default MainLayout;
