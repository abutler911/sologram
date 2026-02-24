import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import AppNav from '../navigation/AppNav';
import Footer from './Footer';
import styled from 'styled-components';
import { COLORS } from '../../theme';
import LoadingSpinner from '../common/LoadingSpinner';

const InstallPrompt = lazy(() => import('../pwa/InstallPrompt'));

/**
 * MainLayout
 *
 * Handles the page shell: AppNav + main content area + Footer.
 *
 * Desktop (≥960px)
 *   - AppNav renders a fixed left sidebar (72px at 960-1199px, 240px at 1200px+)
 *   - The <main> area is offset with matching left margin so content never
 *     slides under the sidebar.
 *
 * Mobile (<960px)
 *   - AppNav renders a sticky top bar + fixed bottom tab bar (52px + safe area)
 *   - The <main> area has bottom padding to clear the tab bar.
 */
const MainLayout = ({
  children,
  noNav = false,
  noFooter = false,
  customHeader = null,
  customFooter = null,
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

      <ContentArea>{isLoading ? <LoadingSpinner /> : children}</ContentArea>

      {!noFooter && (customFooter || <Footer />)}

      <Suspense fallback={null}>
        <InstallPrompt />
      </Suspense>
    </LayoutWrapper>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${COLORS.background};
  transition: background-color 0.3s ease-in-out;
  width: 100%;
  overflow-x: hidden;
`;

const ContentArea = styled.main`
  /*
   * Mobile — column flow, centred, max-width matches the feed column.
   * Add bottom padding equal to the tab bar height so content is never
   * hidden behind it.
   */
  --app-max-width: 470px;
  --tab-bar-height: 52px; /* matches BottomBar height in AppNav */

  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  padding-bottom: calc(var(--tab-bar-height) + env(safe-area-inset-bottom));

  > * {
    width: min(100%, var(--app-max-width));
    margin-left: auto;
    margin-right: auto;
  }

  /*
   * Narrow desktop (960–1199px)
   *   Sidebar is 72px wide.  Shift the feed to the right by that amount, then
   *   re-centre within the remaining space so the single-column feed feels
   *   naturally centred on screen.
   */
  @media (min-width: 960px) {
    --sidebar-width: 72px;

    margin-left: var(--sidebar-width);
    width: calc(100% - var(--sidebar-width));
    padding-bottom: 0; /* no bottom bar on desktop */

    > * {
      /* Re-centre within the remaining viewport width */
      margin-left: auto;
      margin-right: auto;
    }
  }

  /*
   * Full desktop (≥1200px)
   *   Sidebar expands to 240px.
   */
  @media (min-width: 1200px) {
    --sidebar-width: 240px;

    margin-left: var(--sidebar-width);
    width: calc(100% - var(--sidebar-width));
  }
`;

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  noNav: PropTypes.bool,
  noFooter: PropTypes.bool,
  customHeader: PropTypes.node,
  customFooter: PropTypes.node,
  isLoading: PropTypes.bool,
  onSearch: PropTypes.func,
  onClearSearch: PropTypes.func,
};

export default MainLayout;
