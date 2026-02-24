// client/src/context/LikesContext.js
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

export const LikesContext = createContext();

export const LikesProvider = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // Map of postId → boolean (has the current user liked this post)
  const [likedPosts, setLikedPosts] = useState({});

  // Set of postIds currently being processed — per-post locking
  // so two cards can like independently without blocking each other
  const [processingIds, setProcessingIds] = useState(new Set());

  // Ref mirror of likedPosts used inside callbacks to avoid stale closures
  // without adding likedPosts to every dependency array
  const likedPostsRef = useRef(likedPosts);
  useEffect(() => {
    likedPostsRef.current = likedPosts;
  }, [likedPosts]);

  // ── Clear on logout ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setLikedPosts({});
      setProcessingIds(new Set());
    }
  }, [isAuthenticated]);

  // ── Batch check ──────────────────────────────────────────────────────────────
  // Called by Home/PostsGrid after new posts load.
  // Only checks IDs we don't already know about.
  const batchCheckLikeStatus = useCallback(
    async (postIds) => {
      if (!isAuthenticated || !user?._id || !postIds.length) return;

      const unknown = postIds.filter(
        (id) => likedPostsRef.current[id] === undefined
      );
      if (!unknown.length) return;

      try {
        const { results } = await api.batchCheckLikes(unknown);
        setLikedPosts((prev) => {
          const next = { ...prev };
          results.forEach(({ postId, hasLiked }) => {
            next[postId] = hasLiked;
          });
          return next;
        });
      } catch (err) {
        // Non-critical — silently fail, likes just won't be pre-filled
        console.error('batchCheckLikeStatus error:', err);
      }
    },
    [isAuthenticated, user?._id] // likedPosts intentionally NOT here — use ref instead
  );

  // ── Individual check ─────────────────────────────────────────────────────────
  // Kept for PostCard's per-mount check. Returns cached value immediately
  // if we already know, otherwise hits the server.
  const checkLikeStatus = useCallback(
    async (postId) => {
      if (!isAuthenticated || !user?._id) return false;

      // Return cached value — no network call needed
      if (likedPostsRef.current[postId] !== undefined) {
        return likedPostsRef.current[postId];
      }

      try {
        const { hasLiked } = await api.checkLikeStatus(postId);
        setLikedPosts((prev) => ({ ...prev, [postId]: hasLiked }));
        return hasLiked;
      } catch (err) {
        console.error('checkLikeStatus error:', err);
        return false;
      }
    },
    [isAuthenticated, user?._id]
  );

  // ── Like a post ──────────────────────────────────────────────────────────────
  const likePost = useCallback(
    async (postId, onSuccess) => {
      if (!isAuthenticated) {
        toast.error('Please log in to like posts');
        return false;
      }

      // Already liked or this specific post is in-flight — bail out
      if (likedPostsRef.current[postId] || processingIds.has(postId)) {
        return false;
      }

      // Lock this post
      setProcessingIds((prev) => new Set(prev).add(postId));

      try {
        await api.likePost(postId);

        setLikedPosts((prev) => ({ ...prev, [postId]: true }));

        if (typeof onSuccess === 'function') onSuccess();
        return true;
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to like post';
        toast.error(message);
        return false;
      } finally {
        // Always release the lock
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    },
    [isAuthenticated, processingIds]
  );

  // ── Clear ────────────────────────────────────────────────────────────────────
  const clearLikesData = useCallback(() => {
    setLikedPosts({});
    setProcessingIds(new Set());
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  // isProcessing kept as a boolean for backward compatibility with PostCard
  // (it checks `isProcessing` to disable the like button)
  const isProcessing = processingIds.size > 0;

  return (
    <LikesContext.Provider
      value={{
        likedPosts,
        isProcessing,
        processingIds, // available if consumers want per-post granularity
        checkLikeStatus,
        batchCheckLikeStatus,
        likePost,
        clearLikesData,
      }}
    >
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => useContext(LikesContext);
export default LikesContext;
