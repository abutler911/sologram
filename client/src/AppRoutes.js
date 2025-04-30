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
  // Group lazy imports for better organization
  const lazyComponents = useMemo(
    () => ({
      // Public pages
      Home: React.lazy(() => import("./pages/Home")),
      Login: React.lazy(() => import("./pages/Login")),
      Register: React.lazy(() => import("./pages/Register")),
      PostDetail: React.lazy(() => import("./pages/PostDetail")),
      NotFound: React.lazy(() => import("./pages/NotFound")),
      About: React.lazy(() => import("./pages/About")),
      Privacy: React.lazy(() => import("./pages/Privacy")),
      Terms: React.lazy(() => import("./pages/Terms")),
      Thoughts: React.lazy(() => import("./pages/Thoughts")),

      // Collection pages
      CollectionsList: React.lazy(() => import("./pages/CollectionsList")),
      CollectionDetail: React.lazy(() => import("./pages/CollectionDetail")),
      CreateCollection: React.lazy(() => import("./pages/CreateCollection")),
      EditCollection: React.lazy(() => import("./pages/EditCollection")),
      AddPostsToCollection: React.lazy(() =>
        import("./pages/AddPostsToCollection")
      ),

      // Post management
      CreatePost: React.lazy(() => import("./pages/CreatePost")),
      EditPost: React.lazy(() => import("./pages/EditPost")),

      // Story features
      CreateStory: React.lazy(() => import("./pages/CreateStory")),
      StoryArchive: React.lazy(() => import("./pages/StoryArchive")),
      ArchivedStoryView: React.lazy(() => import("./pages/ArchivedStoryView")),

      // Thought management
      CreateThought: React.lazy(() => import("./pages/CreateThought")),
      EditThought: React.lazy(() => import("./pages/EditThought")),

      // Admin/Profile pages

      ProfilePage: React.lazy(() => import("./pages/Profile")),

      // New Cloudinary Gallery page
      CloudinaryGallery: React.lazy(() => import("./pages/CloudinaryGallery")),
    }),
    []
  );

  // Group routes by access type for better organization
  const publicRoutes = [
    {
      path: "/",
      element: (
        <StandardLayout
          headerProps={{
            onSearch: handleSearch,
            onClearSearch: handleClearSearch,
          }}
        >
          <lazyComponents.Home ref={homeRef} />
        </StandardLayout>
      ),
    },
    { path: "/login", element: <lazyComponents.Login /> },
    { path: "/register", element: <lazyComponents.Register /> },
    { path: "/post/:id", element: <lazyComponents.PostDetail /> },
    { path: "/about", element: <lazyComponents.About /> },
    { path: "/privacy", element: <lazyComponents.Privacy /> },
    { path: "/terms", element: <lazyComponents.Terms /> },
    { path: "/collections", element: <lazyComponents.CollectionsList /> },
    { path: "/collections/:id", element: <lazyComponents.CollectionDetail /> },
    { path: "/thoughts", element: <lazyComponents.Thoughts /> },
    { path: "*", element: <lazyComponents.NotFound /> },
  ];

  const privateRoutes = [
    {
      path: "/profile",
      element: (
        <StandardLayout>
          <lazyComponents.ProfilePage />
        </StandardLayout>
      ),
    },

    { path: "/create", element: <lazyComponents.CreatePost /> },
    { path: "/edit/:id", element: <lazyComponents.EditPost /> },

    { path: "/create-story", element: <lazyComponents.CreateStory /> },
    { path: "/story-archive", element: <lazyComponents.StoryArchive /> },
    {
      path: "/story-archive/:id",
      element: <lazyComponents.ArchivedStoryView />,
    },
    {
      path: "/collections/create",
      element: <lazyComponents.CreateCollection />,
    },
    {
      path: "/collections/:id/edit",
      element: <lazyComponents.EditCollection />,
    },
    {
      path: "/collections/:id/add-posts",
      element: <lazyComponents.AddPostsToCollection />,
    },

    { path: "/thoughts/:id/edit", element: <lazyComponents.EditThought /> },
    { path: "/thoughts/create", element: <lazyComponents.CreateThought /> },
    // Add new Cloudinary Gallery route - Admin only
    {
      path: "/media-gallery",
      element: (
        <StandardLayout>
          <lazyComponents.CloudinaryGallery />
        </StandardLayout>
      ),
      roles: ["admin"],
    },
  ];

  // Create a special route component that requires admin role
  const AdminRoute = ({ children }) => {
    return (
      <PrivateRoute>
        {user && user.role === "admin" ? children : <lazyComponents.NotFound />}
      </PrivateRoute>
    );
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Render public routes */}
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Render private routes with authentication */}
        {privateRoutes.map((route) => {
          // If the route requires admin role specifically
          if (route.roles && route.roles.includes("admin")) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={<AdminRoute>{route.element}</AdminRoute>}
              />
            );
          }

          // Regular authenticated routes
          return (
            <Route
              key={route.path}
              path={route.path}
              element={<PrivateRoute>{route.element}</PrivateRoute>}
            />
          );
        })}
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
