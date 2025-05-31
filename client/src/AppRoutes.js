import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
// Assuming PrivateRoute handles auth logic and navigation
import PrivateRoute from "./components/PrivateRoute";

// Import static components used in multiple routes
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import BottomNavigation from "./components/layout/BottomNavigation";
import LoadingSpinner from "./components/common/LoadingSpinner";

// --- Lazy Load Pages ---
// For an even better UX, consider prefetching common next navigations
// e.g., const Login = lazy(() => import(/* webpackPrefetch: true */ "./pages/Login"));

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import(/* webpackPrefetch: true */ "./pages/Login"));
const Register = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/Register")
);
const PostDetail = lazy(() => import("./pages/PostDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Thoughts = lazy(() => import("./pages/Thoughts"));

// Collection pages
const CollectionsList = lazy(() => import("./pages/CollectionsList"));
const CollectionDetail = lazy(() => import("./pages/CollectionDetail"));
const CreateCollection = lazy(() => import("./pages/CreateCollection"));
const EditCollection = lazy(() => import("./pages/EditCollection"));
const AddPostsToCollection = lazy(() => import("./pages/AddPostsToCollection"));

// Post management
const CreatePost = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/CreatePost")
);
const EditPost = lazy(() => import("./pages/EditPost"));

// Story features
const CreateStory = lazy(() => import("./pages/CreateStory"));
const StoryArchive = lazy(() => import("./pages/StoryArchive"));
const ArchivedStoryView = lazy(() => import("./pages/ArchivedStoryView"));

// Thought management
const CreateThought = lazy(() => import("./pages/CreateThought"));
const EditThought = lazy(() => import("./pages/EditThought"));

// Admin/Profile pages
const ProfilePage = lazy(() =>
  import(/* webpackPrefetch: true */ "./pages/Profile")
);
const CloudinaryGallery = lazy(() => import("./pages/CloudinaryGallery"));
const AIContentGenerator = lazy(() =>
  import("./components/admin/AIContentGenerator")
);

// --- Fallback & Layout Components ---
const LoadingFallback = () => <LoadingSpinner />;

// StandardLayout now uses Outlet to render child routes
const StandardLayout = ({ children, headerProps }) => (
  <>
    <Header {...headerProps} />
    <main className="main-content">
      {/* If children is provided directly, render it, otherwise Outlet for nested routes */}
      {children || <Outlet />}
    </main>
    <Footer />
    <BottomNavigation />
  </>
);

// AdminRoute now uses Outlet
const AdminRoute = ({ user }) => {
  // Assuming PrivateRoute already handles the basic "is user logged in?" check.
  // This component specifically checks for the 'admin' role.
  if (!user) {
    // This case should ideally be handled by PrivateRoute wrapping AdminRoute
    return <Navigate to="/login" replace />;
  }
  return user.role === "admin" ? <Outlet /> : <NotFound />; // Or <Navigate to="/unauthorized" />
};

const AppRoutes = ({ user, homeRef, handleSearch, handleClearSearch }) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* --- Group 1: Public Routes with Standard Layout --- */}
        <Route
          element={
            <StandardLayout
              headerProps={{
                onSearch: handleSearch,
                onClearSearch: handleClearSearch,
              }}
            />
          }
        >
          <Route path="/" element={<Home ref={homeRef} />} />{" "}
          {/* Ensure Home uses forwardRef */}
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/collections" element={<CollectionsList />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/thoughts" element={<Thoughts />} />
        </Route>
        {/* --- Group 2: Public Routes without Standard Layout (or with a different layout) --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />{" "}
        {/* These could also use StandardLayout if desired */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* --- Group 3: Private Routes --- */}
        {/* All routes within this PrivateRoute wrapper require authentication */}
        <Route element={<PrivateRoute user={user} />}>
          {" "}
          {/* Pass user to PrivateRoute */}
          {/* Sub-Group 3a: Private routes WITH Standard Layout */}
          <Route element={<StandardLayout />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/story-archive" element={<StoryArchive />} />
            <Route path="/story-archive/:id" element={<ArchivedStoryView />} />
            {/* Add other private routes that need the standard layout here */}
          </Route>
          {/* Sub-Group 3b: Private routes WITHOUT Standard Layout (e.g., fullscreen editors) */}
          <Route path="/create" element={<CreatePost />} />
          <Route path="/edit/:id" element={<EditPost />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/collections/create" element={<CreateCollection />} />
          <Route path="/collections/:id/edit" element={<EditCollection />} />
          <Route
            path="/collections/:id/add-posts"
            element={<AddPostsToCollection />}
          />
          <Route path="/thoughts/create" element={<CreateThought />} />
          <Route path="/thoughts/:id/edit" element={<EditThought />} />
          {/* Sub-Group 3c: Admin-Only Routes (already protected by PrivateRoute, now check role) */}
          {/* These admin routes also get the StandardLayout */}
          <Route element={<AdminRoute user={user} />}>
            {" "}
            {/* Pass user to AdminRoute */}
            <Route element={<StandardLayout />}>
              <Route path="/media-gallery" element={<CloudinaryGallery />} />
              <Route
                path="/admin/ai-content"
                element={<AIContentGenerator />}
              />
            </Route>
          </Route>
        </Route>
        {/* 404 Not Found - Must be the last route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
