// filepath: c:\Users\afbut\Dropbox\newSandbox\SoloGram\client\src\AppRoutes.js
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";

// Import components used in routes
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import BottomNavigation from "./components/layout/BottomNavigation";
import SubscribeBanner from "./components/notifications/SubscribeBanner";

const AppRoutes = ({ user, homeRef, handleSearch, handleClearSearch }) => {
  const Home = React.lazy(() => import("./pages/Home"));
  const Login = React.lazy(() => import("./pages/Login"));
  const Register = React.lazy(() => import("./pages/Register"));
  const PostDetail = React.lazy(() => import("./pages/PostDetail"));
  const CreatePost = React.lazy(() => import("./pages/CreatePost"));
  const EditPost = React.lazy(() => import("./pages/EditPost"));
  const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
  const ProfilePage = React.lazy(() => import("./pages/Profile"));
  const NotFound = React.lazy(() => import("./pages/NotFound"));
  const About = React.lazy(() => import("./pages/About"));
  const Privacy = React.lazy(() => import("./pages/Privacy"));
  const Terms = React.lazy(() => import("./pages/Terms"));
  const SubscriberAdmin = React.lazy(() => import("./pages/SubscriberAdmin"));
  const CollectionsList = React.lazy(() => import("./pages/CollectionsList"));
  const CollectionDetail = React.lazy(() => import("./pages/CollectionDetail"));
  const CreateCollection = React.lazy(() => import("./pages/CreateCollection"));
  const EditCollection = React.lazy(() => import("./pages/EditCollection"));
  const AddPostsToCollection = React.lazy(() =>
    import("./pages/AddPostsToCollection")
  );
  const CreateStory = React.lazy(() => import("./pages/CreateStory"));
  const StoryArchive = React.lazy(() => import("./pages/StoryArchive"));
  const ArchivedStoryView = React.lazy(() =>
    import("./pages/ArchivedStoryView")
  );
  const Analytics = React.lazy(() => import("./pages/Analytics"));
  const CreateThought = React.lazy(() => import("./pages/CreateThought"));
  const EditThought = React.lazy(() => import("./pages/EditThought"));
  const Thoughts = React.lazy(() => import("./pages/Thoughts"));

  return (
    <Suspense fallback={<div>Loading...</div>}>
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
                <SubscribeBanner user={user} />
                <Home ref={homeRef} />
              </main>
              <Footer />
              <BottomNavigation />
            </>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <>
                <Header />
                <main className="main-content">
                  <ProfilePage />
                </main>
                <Footer />
                <BottomNavigation />
              </>
            </PrivateRoute>
          }
        />
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
        <Route path="/thoughts" element={<Thoughts />} />
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
    </Suspense>
  );
};

export default AppRoutes;
