import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DriverCommentReply {
  id: string;
  parent_comment_id: string;
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

interface CreateDriverCommentReplyData {
  parent_comment_id: string;
  content: string;
}

export const useDriverCommentReplies = (commentId?: string) => {
  return useQuery({
    queryKey: ['driver-comment-replies', commentId],
    queryFn: async (): Promise<DriverCommentReply[]> => {
      if (!commentId) return [];

      const { data, error } = await supabase
        .from('driver_comment_replies')
        .select(`
          id,
          parent_comment_id,
          author_id,
          content,
          status,
          created_at
        `)
        .eq('parent_comment_id', commentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching driver comment replies:', error);
        throw error;
      }

      // Fetch profile data separately for each reply
      const repliesWithProfiles = await Promise.all(
        (data || []).map(async (reply) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', reply.author_id)
            .single();

          return {
            ...reply,
            profiles: profile,
          };
        })
      );

      return repliesWithProfiles;
    },
    enabled: !!commentId,
  });
};

export const useCreateDriverCommentReply = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parent_comment_id, content }: CreateDriverCommentReplyData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('driver_comment_replies')
        .insert({
          parent_comment_id,
          author_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-comment-replies', data.parent_comment_id] });
      toast({
        title: "Success",
        description: "Reply posted! It will appear after review.",
      });
    },
    onError: (error) => {
      console.error('Error creating driver comment reply:', error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    },
  });
};