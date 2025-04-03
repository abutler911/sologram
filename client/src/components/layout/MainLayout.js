// client/src/components/layout/MainLayout.js
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import BottomNavigation from "./BottomNavigation";
import InstallPrompt from "../pwa/InstallPrompt";
import FloatingActionButtonAdjuster from "./FloatingActionButtonAdjuster";
import SubscribeBanner from "../notifications/SubscribeBanner";
import styled from "styled-components";

const MainLayout = ({ children, noNav = false, noFooter = false }) => {
  return (
    <LayoutWrapper>
      <Header />
      <main>
        <SubscribeBanner />
        {children}
      </main>
      {!noFooter && <Footer />}
      {!noNav && <BottomNavigation />}
      <InstallPrompt />
      <FloatingActionButtonAdjuster />
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #121212;
`;

export default MainLayout;
