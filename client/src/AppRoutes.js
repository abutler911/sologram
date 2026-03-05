// client/src/AppRoutes.js
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import PrivateRoute from './components/PrivateRoute';
import AppNav from './components/navigation/AppNav';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';

const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const About = React.lazy(() => import('./pages/About'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Thoughts = React.lazy(() => import('./pages/Thoughts'));
const Memoirs = React.lazy(() => import('./pages/Memoirs'));

// Collections
const CollectionsList = React.lazy(() => import('./pages/CollectionsList'));
const CollectionDetail = React.lazy(() => import('./pages/CollectionDetail'));
const CreateCollection = React.lazy(() => import('./pages/CreateCollection'));
const EditCollection = React.lazy(() => import('./pages/EditCollection'));
const AddPostsToCollection = React.lazy(() =>
  import('./pages/AddPostsToCollection')
);

// Posts
const CreatePost = React.lazy(() => import('./pages/CreatePost'));
const EditPost = React.lazy(() => import('./pages/EditPost'));

// Stories
const CreateStory = React.lazy(() => import('./pages/CreateStory'));
const StoryArchive = React.lazy(() => import('./pages/StoryArchive'));
const ArchivedStoryView = React.lazy(() => import('./pages/ArchivedStoryView'));

// Thoughts
const CreateThought = React.lazy(() => import('./pages/CreateThought'));
const EditThought = React.lazy(() => import('./pages/EditThought'));

// Admin / Profile
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const CloudinaryGallery = React.lazy(() => import('./pages/CloudinaryGallery'));
const AIContentGenerator = React.lazy(() =>
  import('./components/admin/AIContentGenerator')
);

// ── Vault (Easter egg destinations) ──────────────────────────────────────────
const SoloGramWrapped = React.lazy(() =>
  import('./pages/vault/SoloGramWrapped')
);
const HackerTerminal = React.lazy(() => import('./pages/vault/HackerTerminal'));
const VaultDocs = React.lazy(() => import('./pages/vault/VaultDocs'));

const LoadingFallback = () => <LoadingSpinner />;

// ── Styled main area — clears the fixed sidebar on desktop ───────────────────
const ContentMain = styled.main`
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;

  /* Mobile: clear the bottom tab bar */
  padding-bottom: calc(52px + env(safe-area-inset-bottom));

  /* Narrow desktop (960–1199px): sidebar is 72px */
  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
    padding-bottom: 0;
  }

  /* Full desktop (≥1200px): sidebar is 240px */
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const StandardLayout = ({ children, headerProps }) => (
  <>
    <AppNav {...headerProps} />
    <ContentMain>{children}</ContentMain>
    <Footer />
  </>
);

const AppRoutes = ({ user, homeRef, handleSearch, handleClearSearch }) => {
  const AdminRoute = ({ children }) => (
    <PrivateRoute>
      {user && user.role === 'admin' ? children : <NotFound />}
    </PrivateRoute>
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route
          path='/'
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
        <Route path='/login' element={<Login />} />
        <Route
          path='/post/:id'
          element={
            <StandardLayout>
              <PostDetail />
            </StandardLayout>
          }
        />
        <Route
          path='/about'
          element={
            <StandardLayout>
              <About />
            </StandardLayout>
          }
        />
        <Route
          path='/privacy'
          element={
            <StandardLayout>
              <Privacy />
            </StandardLayout>
          }
        />
        <Route
          path='/terms'
          element={
            <StandardLayout>
              <Terms />
            </StandardLayout>
          }
        />
        <Route
          path='/collections'
          element={
            <StandardLayout>
              <CollectionsList />
            </StandardLayout>
          }
        />
        <Route
          path='/collections/:id'
          element={
            <StandardLayout>
              <CollectionDetail />
            </StandardLayout>
          }
        />
        <Route
          path='/thoughts'
          element={
            <StandardLayout>
              <Thoughts />
            </StandardLayout>
          }
        />
        <Route
          path='/memoirs'
          element={
            <StandardLayout>
              <Memoirs />
            </StandardLayout>
          }
        />

        {/* ── Private ─────────────────────────────────────────────────── */}
        <Route
          path='/profile'
          element={
            <PrivateRoute>
              <StandardLayout>
                <ProfilePage />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/create'
          element={
            <PrivateRoute>
              <StandardLayout>
                <CreatePost />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/edit/:id'
          element={
            <PrivateRoute>
              <StandardLayout>
                <EditPost />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/create-story'
          element={
            <PrivateRoute>
              <StandardLayout>
                <CreateStory />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/story-archive'
          element={
            <PrivateRoute>
              <StandardLayout>
                <StoryArchive />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/story-archive/:id'
          element={
            <PrivateRoute>
              <StandardLayout>
                <ArchivedStoryView />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/collections/create'
          element={
            <PrivateRoute>
              <StandardLayout>
                <CreateCollection />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/collections/:id/edit'
          element={
            <PrivateRoute>
              <StandardLayout>
                <EditCollection />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/collections/:id/add-posts'
          element={
            <PrivateRoute>
              <StandardLayout>
                <AddPostsToCollection />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/thoughts/:id/edit'
          element={
            <PrivateRoute>
              <StandardLayout>
                <EditThought />
              </StandardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path='/thoughts/create'
          element={
            <PrivateRoute>
              <StandardLayout>
                <CreateThought />
              </StandardLayout>
            </PrivateRoute>
          }
        />

        {/* ── Admin-only ──────────────────────────────────────────────── */}
        <Route
          path='/media-gallery'
          element={
            <AdminRoute>
              <StandardLayout>
                <CloudinaryGallery />
              </StandardLayout>
            </AdminRoute>
          }
        />
        <Route
          path='/admin/ai-content'
          element={
            <AdminRoute>
              <StandardLayout>
                <AIContentGenerator />
              </StandardLayout>
            </AdminRoute>
          }
        />

        {/* ── Vault — Easter egg destinations (no auth, no nav) ──── */}
        <Route path='/vault/wrapped' element={<SoloGramWrapped />} />
        <Route path='/vault/terminal' element={<HackerTerminal />} />
        <Route path='/vault/docs' element={<VaultDocs />} />

        {/* 404 — must be last */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
