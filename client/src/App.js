import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import styled from "styled-components";

// Layout Components
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// Page Components
import Home from "./pages/Home";
import Login from "./pages/Login";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// Static Pages
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Admin Pages
import SubscriberAdmin from "./pages/SubscriberAdmin";

// Collection Pages
import CollectionsList from "./pages/CollectionsList";
import CollectionDetail from "./pages/CollectionDetail";
import CreateCollection from "./pages/CreateCollection";
import EditCollection from "./pages/EditCollection";
import AddPostsToCollection from "./pages/AddPostsToCollection";

// Story Pages
import CreateStory from "./pages/CreateStory";
import StoryArchive from "./pages/StoryArchive";
import ArchivedStoryView from "./pages/ArchivedStoryView";

// PWA Components
import InstallPrompt from "./components/pwa/InstallPrompt";

// Context Provider
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Alert users when they come back online
    if (networkStatus) {
      if (localStorage.getItem("wasOffline") === "true") {
        // Show a notification that the user is back online
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

  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Toaster position="top-right" />
          {!networkStatus && (
            <OfflineIndicator>
              You are currently offline. Some features may be limited.
            </OfflineIndicator>
          )}
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/post/:id" element={<PostDetail />} />

              {/* Static Pages */}
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Admin Routes */}
              <Route
                path="/subscribers"
                element={
                  <PrivateRoute>
                    <SubscriberAdmin />
                  </PrivateRoute>
                }
              />

              {/* Protected Routes */}
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
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              {/* Story Routes */}
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

              {/* Collection routes */}
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

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />

          {/* PWA Install Prompt */}
          <InstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Styled offline indicator (using styled-components)
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

export default App;
