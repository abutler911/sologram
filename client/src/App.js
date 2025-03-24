import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import styled from "styled-components";
import OneSignal from "react-onesignal";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Profile from "./pages/Profile";
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

import InstallPrompt from "./components/pwa/InstallPrompt";
import SubscribeBanner from "./components/notifications/SubscribeBanner"; // ✅ Added banner

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import { initializeOneSignal } from "./utils/oneSignal";

function App() {
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [oneSignalInitialized, setOneSignalInitialized] = useState(false);
  const homeRef = useRef(null);

  useEffect(() => {
    const setupOneSignal = async () => {
      try {
        const result = await initializeOneSignal();
        setOneSignalInitialized(result);

        if (result) {
          console.log("OneSignal initialized successfully");
        } else {
          console.warn("OneSignal initialization failed");
        }
      } catch (error) {
        console.error("Error initializing OneSignal:", error);
      }
    };

    setupOneSignal();
  }, []);

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
    if (homeRef.current && homeRef.current.handleHeaderSearch) {
      homeRef.current.handleHeaderSearch(query);
    }
  };

  const handleClearSearch = () => {
    if (homeRef.current && homeRef.current.clearSearch) {
      homeRef.current.clearSearch();
    }
  };

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
          <SubscribeBanner /> {/* ✅ Show notification banner globally */}
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
                    <Home ref={homeRef} />
                  </main>
                  <Footer />
                </>
              }
            />

            <Route
              path="*"
              element={
                <>
                  <Header />
                  <main className="main-content">
                    <Routes>
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
                        path="/profile"
                        element={
                          <PrivateRoute>
                            <Profile />
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

                      <Route
                        path="/collections"
                        element={<CollectionsList />}
                      />
                      <Route
                        path="/collections/:id"
                        element={<CollectionDetail />}
                      />
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

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />
          </Routes>
          <InstallPrompt />
        </div>
      </Router>
    </AuthProvider>
  );
}

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
