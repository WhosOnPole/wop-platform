import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TrackComment {
  id: string;
  track_id: string;
  author_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useTrackComments = (trackId: string) => {
  return useQuery({
    queryKey: ['track-comments', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_comments')
        .select(`
          id,
          track_id,
          author_id,
          content,
          status,
          created_at,
          updated_at,
          profiles!track_comments_author_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('track_id', trackId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching track comments:', error);
        throw error;
      }

      return data as TrackComment[];
    },
    enabled: !!trackId,
  });
};

export const useCreateTrackComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, content }: { trackId: string; content: string }) => {
      if (!user) {
        throw new Error('You must be logged in to comment');
      }

      const { data, error } = await supabase
        .from('track_comments')
        .insert([
          {
            track_id: trackId,
            author_id: user.id,
            content: content.trim(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating track comment:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['track-comments', variables.trackId] });
      toast({
        title: "Comment submitted!",
        description: "Your comment will be reviewed before appearing.",
      });
    },
    onError: (error) => {
      console.error('Failed to create comment:', error);
      toast({
        title: "Failed to submit comment",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });
};