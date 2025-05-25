import React, { Suspense, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";

// Import static components used in multiple routes
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import BottomNavigation from "./components/layout/BottomNavigation";
import LoadingSpinner from "./components/common/LoadingSpinner";

const LoadingFallback = () => <LoadingSpinner />;

// Layout component to avoid repetition
const StandardLayout = ({ children, headerProps }) => (
  <>
    <Header {...headerProps} />
    <main className="main-content">{children}</main>
    <Footer />
    <BottomNavigation />
  </>
);

const AppRoutes = ({ user, homeRef, handleSearch, handleClearSearch }) => {
  // Lazy load components
  const Home = React.lazy(() => import("./pages/Home"));
  const Login = React.lazy(() => import("./pages/Login"));
  const Register = React.lazy(() => import("./pages/Register"));
  const PostDetail = React.lazy(() => import("./pages/PostDetail"));
  const NotFound = React.lazy(() => import("./pages/NotFound"));
  const About = React.lazy(() => import("./pages/About"));
  const Privacy = React.lazy(() => import("./pages/Privacy"));
  const Terms = React.lazy(() => import("./pages/Terms"));
  const Thoughts = React.lazy(() => import("./pages/Thoughts"));

  // Collection pages
  const CollectionsList = React.lazy(() => import("./pages/CollectionsList"));
  const CollectionDetail = React.lazy(() => import("./pages/CollectionDetail"));
  const CreateCollection = React.lazy(() => import("./pages/CreateCollection"));
  const EditCollection = React.lazy(() => import("./pages/EditCollection"));
  const AddPostsToCollection = React.lazy(() =>
    import("./pages/AddPostsToCollection")
  );

  // Post management
  const CreatePost = React.lazy(() => import("./pages/CreatePost"));
  const EditPost = React.lazy(() => import("./pages/EditPost"));

  // Story features
  const CreateStory = React.lazy(() => import("./pages/CreateStory"));
  const StoryArchive = React.lazy(() => import("./pages/StoryArchive"));
  const ArchivedStoryView = React.lazy(() =>
    import("./pages/ArchivedStoryView")
  );

  // Thought management
  const CreateThought = React.lazy(() => import("./pages/CreateThought"));
  const EditThought = React.lazy(() => import("./pages/EditThought"));

  // Admin/Profile pages
  const ProfilePage = React.lazy(() => import("./pages/Profile"));
  const CloudinaryGallery = React.lazy(() =>
    import("./pages/CloudinaryGallery")
  );
  const AIContentGenerator = React.lazy(() =>
    import("./components/admin/AIContentGenerator")
  );

  // Create a special route component that requires admin role
  const AdminRoute = ({ children }) => {
    return (
      <PrivateRoute>
        {user && user.role === "admin" ? children : <NotFound />}
      </PrivateRoute>
    );
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <StandardLayout
              headerProps={{
                onSearch: handleSearch,
                onClearSearch: handleClearSearch,
              }}
            >
              <Home ref={homeRef} />
            </StandardLayout>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/collections" element={<CollectionsList />} />
        <Route path="/collections/:id" element={<CollectionDetail />} />
        <Route path="/thoughts" element={<Thoughts />} />

        {/* Private routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <StandardLayout>
                <ProfilePage />
              </StandardLayout>
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

        {/* Admin-only routes */}
        <Route
          path="/media-gallery"
          element={
            <AdminRoute>
              <StandardLayout>
                <CloudinaryGallery />
              </StandardLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ai-content"
          element={
            <AdminRoute>
              <StandardLayout>
                <AIContentGenerator />
              </StandardLayout>
            </AdminRoute>
          }
        />

        {/* 404 - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
