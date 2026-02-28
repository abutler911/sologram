import React, { useState, useEffect, useRef, useContext } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import styled from 'styled-components';
import ReactGA from 'react-ga4';
import { HelmetProvider } from 'react-helmet-async';
import { AuthContext } from './context/AuthContext';
import { LikesProvider } from './context/LikesContext';
import { CommentsProvider } from './context/CommentsContext';
import { DeleteModalProvider } from './context/DeleteModalContext';
import ScrollToTop from './components/ScrollToTop';
import InstallPrompt from './components/pwa/InstallPrompt';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import AppRoutes from './AppRoutes';
import CopilotChat from './components/CopilotChat';

// Separate components for better organization
const PageTracker = () => {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({
      hitType: 'pageview',
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

  // Network status effect
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle offline/online notifications
    if (networkStatus && localStorage.getItem('wasOffline') === 'true') {
      toast.success('You are back online');
      localStorage.removeItem('wasOffline');
    } else if (!networkStatus) {
      localStorage.setItem('wasOffline', 'true');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [networkStatus]);

  // Search handlers
  const handleSearch = (query) => {
    homeRef.current?.handleHeaderSearch?.(query);
  };

  const handleClearSearch = () => {
    homeRef.current?.clearSearch?.();
  };

  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <PageTracker />
        <div className='app'>
          <LikesProvider>
            <CommentsProvider>
              {' '}
              {/* Add CommentsProvider here */}
              <DeleteModalProvider>
                <Toaster position='top-right' />
                {!networkStatus && (
                  <OfflineIndicator>
                    You are currently offline. Some features may be limited.
                  </OfflineIndicator>
                )}
                <AppRoutes
                  user={user}
                  homeRef={homeRef}
                  handleSearch={handleSearch}
                  handleClearSearch={handleClearSearch}
                />
                <InstallPrompt />
                <CopilotChat />
                <DeleteConfirmationModal />
              </DeleteModalProvider>
            </CommentsProvider>{' '}
            {/* Close CommentsProvider here */}
          </LikesProvider>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
