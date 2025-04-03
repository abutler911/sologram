// client/src/components/layout/MainLayout.js
import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import BottomNavigation from "./BottomNavigation";
import FloatingActionButtonAdjuster from "./FloatingActionButtonAdjuster";
import styled from "styled-components";

const MainLayout = ({ children }) => {
  return (
    <LayoutWrapper>
      <Header />
      <MainContent>{children}</MainContent>
      <FloatingActionButtonAdjuster />
      <Footer />
      <BottomNavigation />
    </LayoutWrapper>
  );
};

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #121212;
`;

const MainContent = styled.main`
  flex: 1;
  padding-bottom: 60px;
`;

export default MainLayout;
