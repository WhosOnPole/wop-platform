import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useDriverCommentLikes = (commentId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has liked the comment
  const { data: isLiked = false, isLoading } = useQuery({
    queryKey: ['driver-comment-like-status', user?.id, commentId],
    queryFn: async () => {
      if (!user || !commentId) return false;

      const { data, error } = await supabase
        .from('driver_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!(user && commentId),
  });

  // Get like count for a comment
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['driver-comment-like-count', commentId],
    queryFn: async () => {
      if (!commentId) return 0;

      const { data, error } = await supabase.rpc('get_driver_comment_like_count', {
        target_comment_id: commentId
      });

      if (error) {
        console.error('Error fetching like count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!commentId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !commentId) throw new Error('Missing user or comment');

      const { error } = await supabase
        .from('driver_comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-comment-like-status', user?.id, commentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-comment-like-count', commentId] });
      toast({
        title: "Success",
        description: "Comment liked!",
      });
    },
    onError: (error) => {
      console.error('Error liking comment:', error);
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !commentId) throw new Error('Missing user or comment');

      const { error } = await supabase
        .from('driver_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-comment-like-status', user?.id, commentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-comment-like-count', commentId] });
      toast({
        title: "Success",
        description: "Comment unliked",
      });
    },
    onError: (error) => {
      console.error('Error unliking comment:', error);
      toast({
        title: "Error",
        description: "Failed to unlike comment",
        variant: "destructive",
      });
    },
  });

  const toggleLike = () => {
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  return {
    isLiked,
    likeCount,
    isLoading,
    toggleLike,
    isToggling: likeMutation.isPending || unlikeMutation.isPending,
  };
};