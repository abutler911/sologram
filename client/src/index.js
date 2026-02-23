// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import axios from 'axios';
import ReactGA from 'react-ga4';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // NEW
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // NEW
import { AuthProvider } from './context/AuthContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { COLORS } from './theme';
import GlobalStyle from './styles/GlobalStyles';

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID, {
    testMode: process.env.REACT_APP_GA_TEST_MODE === 'true',
  });
}

axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

// NEW — global query client config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // data stays fresh 2 min
      retry: 1, // only retry failed requests once
      refetchOnWindowFocus: false, // don't refetch just because user switched tabs
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GlobalStyle />
    <QueryClientProvider client={queryClient}>
      {' '}
      {/* NEW */}
      <AuthProvider>
        <App />
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}{' '}
      {/* NEW - dev only */}
    </QueryClientProvider>
  </React.StrictMode>
);

const registerServiceWorker = () => {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      if (!registration || !registration.waiting) return;
      const newVersion = registration.waiting.scriptURL.split('/').pop();
      const currentVersion = registration.active?.scriptURL.split('/').pop();
      if (newVersion === currentVersion) return;
      if (document.getElementById('update-notification')) return;
      const updateBar = document.createElement('div');
      updateBar.id = 'update-notification';
      updateBar.innerHTML = `
        <div style="
          position: fixed;
          bottom: 76px;
          right: 20px;
          background-color: ${COLORS.primaryBlueGray};
          color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px ${COLORS.shadow};
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10000;
          max-width: 320px;
        ">
          <div>
            <p style="margin: 0 0 6px 0; font-weight: bold;">Update Available</p>
            <p style="margin: 0; font-size: 14px;">Refresh to get the latest version.</p>
          </div>
          <button id="update-app-button" style="
            background-color: ${COLORS.primarySalmon};
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 14px;
            cursor: pointer;
            margin-left: 12px;
          ">Update</button>
        </div>
      `;
      document.body.appendChild(updateBar);
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (window.__refreshing) return;
        window.__refreshing = true;
        window.location.reload();
      });
      window.__refreshing = false;
      document
        .getElementById('update-app-button')
        .addEventListener('click', () => {
          if (updateBar.parentNode) updateBar.parentNode.removeChild(updateBar);
          registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        });
    },
  });
};

setTimeout(() => {
  registerServiceWorker();
}, 3000);
