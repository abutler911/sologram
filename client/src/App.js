import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import BottomNavigation from "./components/layout/BottomNavigation";
import SubscribeBanner from "./components/notifications/SubscribeBanner";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Login from "./pages/Login";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SubscriberAdmin from "./pages/SubscriberAdmin";
import CollectionsList from "./pages/CollectionsList";
import CollectionDetail from "./pages/CollectionDetail";
import CreateCollection from "./pages/CreateCollection";
import EditCollection from "./pages/EditCollection";
import AddPostsToCollection from "./pages/AddPostsToCollection";
import CreateStory from "./pages/CreateStory";
import StoryArchive from "./pages/StoryArchive";
import ArchivedStoryView from "./pages/ArchivedStoryView";
import Analytics from "./pages/Analytics";
import CreateThought from "./pages/CreateThought";
import EditThought from "./pages/EditThought";

import InstallPrompt from "./components/pwa/InstallPrompt";
import FloatingActionButtonAdjuster from "./components/layout/FloatingActionButtonAdjuster";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

serviceWorkerRegistration.register();

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
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

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (networkStatus) {
      if (localStorage.getItem("wasOffline") === "true") {
        toast.success("You are back online");
        localStorage.removeItem("wasOffline");
      }
    } else {
      localStorage.setItem("wasOffline", "true");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [networkStatus]);

  const handleSearch = (query) => {
    if (homeRef.current?.handleHeaderSearch) {
      homeRef.current.handleHeaderSearch(query);
    }
  };

  const handleClearSearch = () => {
    if (homeRef.current?.clearSearch) {
      homeRef.current.clearSearch();
    }
  };

  return (
    <AuthProvider>
      <HelmetProvider>
        <Router>
          <ScrollToTop />
          <PageTracker />
          <div className="app">
            <Toaster position="top-right" />
            {!networkStatus && (
              <OfflineIndicator>
                You are currently offline. Some features may be limited.
              </OfflineIndicator>
            )}
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Header
                      onSearch={handleSearch}
                      onClearSearch={handleClearSearch}
                    />
                    <main className="main-content">
                      <SubscribeBanner />
                      <Home ref={homeRef} />
                    </main>
                    <Footer />
                    <BottomNavigation />
                  </>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/subscribers"
                element={
                  <PrivateRoute>
                    <SubscriberAdmin />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <PrivateRoute>
                    <CreatePost />
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <PrivateRoute>
                    <EditPost />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-story"
                element={
                  <PrivateRoute>
                    <CreateStory />
                  </PrivateRoute>
                }
              />
              <Route
                path="/story-archive"
                element={
                  <PrivateRoute>
                    <StoryArchive />
                  </PrivateRoute>
                }
              />
              <Route
                path="/story-archive/:id"
                element={
                  <PrivateRoute>
                    <ArchivedStoryView />
                  </PrivateRoute>
                }
              />
              <Route path="/collections" element={<CollectionsList />} />
              <Route path="/collections/:id" element={<CollectionDetail />} />
              <Route
                path="/collections/create"
                element={
                  <PrivateRoute>
                    <CreateCollection />
                  </PrivateRoute>
                }
              />
              <Route
                path="/collections/:id/edit"
                element={
                  <PrivateRoute>
                    <EditCollection />
                  </PrivateRoute>
                }
              />
              <Route
                path="/collections/:id/add-posts"
                element={
                  <PrivateRoute>
                    <AddPostsToCollection />
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <Analytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/thoughts/:id/edit"
                element={
                  <PrivateRoute>
                    <EditThought />
                  </PrivateRoute>
                }
              />
              <Route
                path="/thoughts/create"
                element={
                  <PrivateRoute>
                    <CreateThought />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <InstallPrompt />
            <FloatingActionButtonAdjuster />
          </div>
        </Router>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
