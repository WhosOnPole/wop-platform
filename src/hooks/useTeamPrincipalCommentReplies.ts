import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TeamPrincipalCommentReply {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  parent_comment_id: string;
  status: 'pending' | 'approved' | 'rejected';
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useTeamPrincipalCommentReplies = (commentId?: string) => {
  return useQuery({
    queryKey: ['team-principal-comment-replies', commentId],
    queryFn: async () => {
      if (!commentId) return [];
      
      const { data, error } = await supabase
        .from('team_principal_comment_replies')
        .select(`
          *,
          profiles!author_id(username, display_name, avatar_url)
        `)
        .eq('parent_comment_id', commentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as any;
    },
    enabled: !!commentId,
  });
};

export const useCreateTeamPrincipalCommentReply = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('team_principal_comment_replies')
        .insert([
          {
            parent_comment_id: commentId,
            content,
            author_id: user.id,
          },
        ]);

      if (error) throw error;
    },
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['team-principal-comment-replies', commentId] });
      toast({
        title: 'Reply posted!',
        description: 'Your reply has been posted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to post reply. Please try again.',
        variant: 'destructive',
      });
    },
  });
};