// client/src/hooks/queries/usePosts.js
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

// ── Query Keys ────────────────────────────────────────────────────────────────
// Centralized so cache invalidations are consistent everywhere.
//
// infiniteFeed() returns the BASE prefix ['posts', 'infinite'].
// The actual query key used by useInfinitePosts appends isAuthenticated:
//   ['posts', 'infinite', true]  or  ['posts', 'infinite', false]
//
// This ensures React Query treats the logged-in and logged-out feeds as
// separate queries, so stale cached data from a logged-out session is never
// served after login (which would show hasLiked: false on everything).
//
// Cache helpers (patchInfinitePost, handlePostDelete) use the base prefix
// with setQueriesData so they match BOTH auth variants.

export const postKeys = {
  infiniteFeed: () => ['posts', 'infinite'],
  search: (q) => ['posts', 'search', q],
  detail: (id) => ['post', id],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
// Immutably update a single post inside an infinite query cache.
// Uses setQueriesData with the base prefix to match both authed and
// unauthed cache entries.

export const patchInfinitePost = (queryClient, postId, updater) => {
  queryClient.setQueriesData({ queryKey: postKeys.infiniteFeed() }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: page.data.map((p) => (p._id === postId ? updater(p) : p)),
      })),
    };
  });
};

// ── Queries ───────────────────────────────────────────────────────────────────

// Infinite scroll feed — primary query for Home page.
// isAuthenticated is part of the query key so that logging in/out
// triggers a fresh fetch with the correct Authorization header.
export const useInfinitePosts = (isAuthenticated = false) =>
  useInfiniteQuery({
    queryKey: [...postKeys.infiniteFeed(), isAuthenticated],
    queryFn: ({ pageParam = 1 }) => api.getPosts(pageParam, 6),
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined,
    staleTime: 2 * 60 * 1000, // 2 min — don't re-fetch on every mount
  });

// Search results — flat list, no pagination
export const useSearchPosts = (query) =>
  useQuery({
    queryKey: postKeys.search(query),
    queryFn: () => api.searchPosts(query),
    enabled: !!query,
    staleTime: 60 * 1000, // 1 min — searches can go stale a bit faster
  });

// Single post detail
export const usePost = (id) =>
  useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => api.getPost(id),
    enabled: !!id,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted successfully');
    },
    onError: () => toast.error('Failed to delete post'),
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.toggleLike('post', id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
    },
    onError: () => toast.error('Failed to like post'),
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to create post'),
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updatePost(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: postKeys.detail(id) });
      toast.success('Post updated successfully!');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update post'),
  });
};

// Legacy single-page query kept for any non-Home consumers
export const usePosts = (page = 1) =>
  useQuery({
    queryKey: ['posts', page],
    queryFn: () => api.getPosts(page),
  });
