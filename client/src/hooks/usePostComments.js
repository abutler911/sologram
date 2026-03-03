// hooks/usePostComments.js
// Polymorphic comment management for any content type (post, thought, story).
// Extracted from PostCard — also consumed by PostDetail.
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

const usePostComments = (targetType, targetId, { isAuthenticated } = {}) => {
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!targetId) return;
    setIsLoading(true);
    try {
      const data = await api.getComments(targetType, targetId);
      const list = Array.isArray(data.comments) ? data.comments : [];
      setComments(list);
      if (typeof data.total === 'number') setCommentCount(data.total);
    } catch (err) {
      console.error('[fetchComments]', err);
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  const addComment = useCallback(
    async (commentData) => {
      if (!isAuthenticated) {
        toast.error('You must be logged in to comment');
        return;
      }
      try {
        const text = commentData.text || commentData;
        const replyTo = commentData.replyTo || commentData.parentId || null;
        const data = await api.addComment(targetType, targetId, text, replyTo);
        const newComment = data.comment;
        if (!newComment) throw new Error('Bad response from server');
        setComments((prev) => [newComment, ...prev]);
        setCommentCount((prev) => prev + 1);
        return newComment;
      } catch (err) {
        const msg = err?.response?.data?.message || 'Could not post comment';
        toast.error(msg);
        throw err;
      }
    },
    [targetType, targetId, isAuthenticated]
  );

  const deleteComment = useCallback(async (commentId) => {
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
      toast.success('Comment removed');
    } catch {
      toast.error('Failed to delete comment');
    }
  }, []);

  const likeComment = useCallback(
    async (commentId) => {
      if (!isAuthenticated) {
        toast.error('Log in to like comments');
        return;
      }
      try {
        const data = await api.toggleLike('comment', commentId);
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? { ...c, likes: data.count, hasLiked: data.liked }
              : c
          )
        );
      } catch {
        toast.error('Could not update like');
      }
    },
    [isAuthenticated]
  );

  // Allow parent to seed the count from server data without a fetch
  const seedCount = useCallback((n) => setCommentCount(n), []);

  return {
    comments,
    commentCount,
    isLoading,
    fetchComments,
    addComment,
    deleteComment,
    likeComment,
    seedCount,
  };
};

export default usePostComments;
