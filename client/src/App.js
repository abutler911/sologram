import React, { lazy, Suspense, useState, useEffect, useRef } from "react";
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
import InstallPrompt from "./components/pwa/InstallPrompt";
import FloatingActionButtonAdjuster from "./components/layout/FloatingActionButtonAdjuster";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const EditPost = lazy(() => import("./pages/EditPost"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const SubscriberAdmin = lazy(() => import("./pages/SubscriberAdmin"));
const CollectionsList = lazy(() => import("./pages/CollectionsList"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const CreateCollection = lazy(() => import("./pages/CreateCollection"));
const EditCollection = lazy(() => import("./pages/EditCollection"));
const AddPostsToCollection = lazy(() => import("./pages/AddPostsToCollection"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const StoryArchive = lazy(() => import("./pages/StoryArchive"));
const ArchivedStoryView = lazy(() => import("./pages/ArchivedStoryView"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CreateThought = lazy(() => import("./pages/CreateThought"));
const EditThought = lazy(() => import("./pages/EditThought"));
const Thoughts = lazy(() => import("./pages/Thoughts"));

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
                      <Suspense fallback={<div>Loading...</div>}>
                        <Home ref={homeRef} />
                      </Suspense>
                    </main>
                    <Footer />
                    <BottomNavigation />
                  </>
                }
              />
              <Route
                path="/login"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Login />
                  </Suspense>
                }
              />
              <Route
                path="/register"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Register />
                  </Suspense>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <>
                      <Header />
                      <main className="main-content">
                        <Suspense fallback={<div>Loading...</div>}>
                          <ProfilePage />
                        </Suspense>
                      </main>
                      <Footer />
                      <BottomNavigation />
                    </>
                  </PrivateRoute>
                }
              />

              <Route
                path="/post/:id"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <PostDetail />
                  </Suspense>
                }
              />
              <Route
                path="/about"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <About />
                  </Suspense>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Privacy />
                  </Suspense>
                }
              />
              <Route
                path="/terms"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Terms />
                  </Suspense>
                }
              />
              <Route
                path="/subscribers"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <SubscriberAdmin />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CreatePost />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <EditPost />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AdminDashboard />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/create-story"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CreateStory />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/story-archive"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <StoryArchive />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/story-archive/:id"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <ArchivedStoryView />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/collections"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <CollectionsList />
                  </Suspense>
                }
              />
              <Route
                path="/collections/:id"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <CollectionDetail />
                  </Suspense>
                }
              />
              <Route
                path="/collections/create"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CreateCollection />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/collections/:id/edit"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <EditCollection />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/collections/:id/add-posts"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <AddPostsToCollection />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <Analytics />
                    </Suspense>
                  </PrivateRoute>
                }
              />

              <Route
                path="/thoughts"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <Thoughts />
                  </Suspense>
                }
              />

              <Route
                path="/thoughts/:id/edit"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <EditThought />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="/thoughts/create"
                element={
                  <PrivateRoute>
                    <Suspense fallback={<div>Loading...</div>}>
                      <CreateThought />
                    </Suspense>
                  </PrivateRoute>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <NotFound />
                  </Suspense>
                }
              />
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
