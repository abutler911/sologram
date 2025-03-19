import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

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
// Subscriber Pages
import SubscriberAdmin from "./pages/SubscriberAdmin";
// Context Provider
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Toaster position="top-right" />
          <Header />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

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

              {/* Subscriber Admin Route */}
              <Route
                path="/subscribers"
                element={
                  <PrivateRoute>
                    <SubscriberAdmin />
                  </PrivateRoute>
                }
              />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
