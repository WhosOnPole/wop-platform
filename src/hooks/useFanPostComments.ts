import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FanPostComment {
  id: string;
  fan_post_id: string;
  author_id: string;
  content: string;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CreateFanPostCommentData {
  fan_post_id: string;
  content: string;
}

export const useFanPostComments = (fanPostId?: string) => {
  return useQuery({
    queryKey: ['fan-post-comments', fanPostId],
    queryFn: async (): Promise<FanPostComment[]> => {
      if (!fanPostId) return [];

      const { data, error } = await supabase
        .from('fan_post_comments')
        .select(`
          id,
          fan_post_id,
          author_id,
          content,
          status,
          created_at
        `)
        .eq('fan_post_id', fanPostId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching fan post comments:', error);
        throw error;
      }

      // Fetch profile data separately for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', comment.author_id)
            .single();

          return {
            ...comment,
            profiles: profile,
          };
        })
      );

      return commentsWithProfiles;
    },
    enabled: !!fanPostId,
  });
};

export const useCreateFanPostComment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fan_post_id, content }: CreateFanPostCommentData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('fan_post_comments')
        .insert({
          fan_post_id,
          author_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fan-post-comments', data.fan_post_id] });
      queryClient.invalidateQueries({ queryKey: ['fan-post-comment-count', data.fan_post_id] });
      toast({
        title: "Comment submitted",
        description: "Your comment will be reviewed before appearing publicly.",
      });
    },
    onError: (error) => {
      console.error('Error creating fan post comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });
};

export const useFanPostCommentCount = (fanPostId?: string) => {
  return useQuery({
    queryKey: ['fan-post-comment-count', fanPostId],
    queryFn: async () => {
      if (!fanPostId) return 0;

      const { data, error } = await supabase.rpc('get_fan_post_comment_count', {
        target_post_id: fanPostId
      });

      if (error) {
        console.error('Error fetching comment count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!fanPostId,
  });
};