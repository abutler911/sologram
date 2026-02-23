// client/src/hooks/queries/useStories.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

export const useStories = () =>
  useQuery({
    queryKey: ['stories'],
    queryFn: api.getStories,
  });

export const useDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted successfully');
    },
    onError: () => toast.error('Failed to delete story'),
  });
};

export const useArchiveStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.archiveStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['archivedStories'] });
      toast.success('Story archived');
    },
    onError: () => toast.error('Failed to archive story'),
  });
};

// ── Archived ───────────────────────────────────────────────────────────

export const useArchivedStories = () =>
  useQuery({
    queryKey: ['archivedStories'],
    queryFn: api.getArchivedStories,
  });

export const useArchivedStory = (id) =>
  useQuery({
    queryKey: ['archivedStory', id],
    queryFn: () => api.getArchivedStory(id),
    enabled: !!id,
  });

export const useDeleteArchivedStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteArchivedStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archivedStories'] });
      toast.success('Story deleted permanently');
    },
    onError: () => toast.error('Failed to delete story'),
  });
};
