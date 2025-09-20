import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useTeamCommentLikes = (commentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: likesData, isLoading } = useQuery({
    queryKey: ['team-comment-likes', commentId],
    queryFn: async () => {
      if (!commentId) return { likes: [], userLiked: false, count: 0 };
      
      const { data: likes, error } = await supabase
        .from('team_comment_likes')
        .select('*')
        .eq('comment_id', commentId);

      if (error) throw error;

      const userLiked = user ? likes.some(like => like.user_id === user.id) : false;
      
      return {
        likes: likes || [],
        userLiked,
        count: likes?.length || 0
      };
    },
    enabled: !!commentId,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !commentId) throw new Error('User not authenticated or no comment ID');

      const isLiked = likesData?.userLiked || false;

      if (isLiked) {
        const { error } = await supabase
          .from('team_comment_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_comment_likes')
          .insert([{ user_id: user.id, comment_id: commentId }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-comment-likes', commentId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    },
  });

  return {
    isLiked: likesData?.userLiked || false,
    likeCount: likesData?.count || 0,
    isLoading,
    toggleLike: toggleLikeMutation.mutate,
    isToggling: toggleLikeMutation.isPending,
  };
};