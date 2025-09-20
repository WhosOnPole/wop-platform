import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TrackCommentModeration {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  author_id: string;
  track_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  tracks: {
    name: string;
  } | null;
}

export const useTrackCommentsModeration = () => {
  return useQuery({
    queryKey: ['track-comments-moderation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_comments')
        .select(`
          *,
          profiles!author_id(username, display_name, avatar_url),
          tracks!track_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
  });
};

export const useUpdateTrackCommentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('track_comments')
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['track-comments-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['track-comments'] });
      toast({
        title: status === 'approved' ? 'Comment approved' : 'Comment rejected',
        description: `The track comment has been ${status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update comment status.',
        variant: 'destructive',
      });
    },
  });
};