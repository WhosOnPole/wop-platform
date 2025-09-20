import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FanPostCommentModeration {
  id: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  author_id: string;
  fan_post_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  fan_posts: {
    caption: string | null;
    image_url: string;
  } | null;
}

export const useFanPostCommentsModeration = () => {
  return useQuery({
    queryKey: ['fan-post-comments-moderation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fan_post_comments')
        .select(`
          *,
          profiles!author_id(username, display_name, avatar_url),
          fan_posts!fan_post_id(caption, image_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    },
  });
};

export const useUpdateFanPostCommentStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, status }: { commentId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('fan_post_comments')
        .update({ status })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['fan-post-comments-moderation'] });
      queryClient.invalidateQueries({ queryKey: ['fan-post-comments'] });
      toast({
        title: status === 'approved' ? 'Comment approved' : 'Comment rejected',
        description: `The fan post comment has been ${status}.`,
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