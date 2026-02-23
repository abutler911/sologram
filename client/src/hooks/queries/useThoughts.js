// client/src/hooks/queries/useThoughts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

export const useThoughts = (page = 1, searchQuery = '') =>
  useQuery({
    queryKey: ['thoughts', page, searchQuery],
    queryFn: () => api.getThoughts(page, searchQuery),
  });

export const useThought = (id) =>
  useQuery({
    queryKey: ['thought', id],
    queryFn: () => api.getThought(id),
    enabled: !!id,
  });

export const useCreateThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createThought,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      toast.success('Thought created successfully');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to create thought'),
  });
};

export const useUpdateThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateThought(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      queryClient.invalidateQueries({ queryKey: ['thought', id] });
      toast.success('Thought updated successfully');
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update thought'),
  });
};

export const useDeleteThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteThought,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      toast.success('Thought deleted successfully');
    },
    onError: () => toast.error('Failed to delete thought'),
  });
};

export const useLikeThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.likeThought,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
    },
    onError: () => toast.error('Failed to like thought'),
  });
};

export const usePinThought = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.pinThought,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['thoughts'] });
      toast.success(
        `Thought ${data?.data?.pinned ? 'pinned' : 'unpinned'} successfully`
      );
    },
    onError: () => toast.error('Failed to update pin status'),
  });
};
