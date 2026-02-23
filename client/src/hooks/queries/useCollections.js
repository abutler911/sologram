// client/src/hooks/queries/useCollections.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

export const useCollections = () =>
  useQuery({
    queryKey: ['collections'],
    queryFn: api.getCollections,
  });

export const useCollection = (id) =>
  useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.getCollection(id),
    enabled: !!id,
  });

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created successfully');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to create collection'),
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateCollection(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      toast.success('Collection updated successfully');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update collection'),
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection deleted successfully');
    },
    onError: () => toast.error('Failed to delete collection'),
  });
};

export const useAddPostsToCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, postIds }) => api.addPostsToCollection(id, postIds),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
      toast.success('Posts added to collection');
    },
    onError: () => toast.error('Failed to add posts to collection'),
  });
};

export const useRemovePostFromCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionId, postId }) =>
      api.removePostFromCollection(collectionId, postId),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      toast.success('Post removed from collection');
    },
    onError: () => toast.error('Failed to remove post from collection'),
  });
};
