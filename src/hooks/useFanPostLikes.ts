import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFanPostLikes = (fanPostId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has liked the fan post
  const { data: isLiked = false, isLoading } = useQuery({
    queryKey: ['fan-post-like-status', user?.id, fanPostId],
    queryFn: async () => {
      if (!user || !fanPostId) return false;

      const { data, error } = await supabase
        .from('fan_post_likes')
        .select('id')
        .eq('fan_post_id', fanPostId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!(user && fanPostId),
  });

  // Get like count for a fan post
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['fan-post-like-count', fanPostId],
    queryFn: async () => {
      if (!fanPostId) return 0;

      const { data, error } = await supabase.rpc('get_fan_post_like_count', {
        target_post_id: fanPostId
      });

      if (error) {
        console.error('Error fetching like count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!fanPostId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !fanPostId) throw new Error('Missing user or fan post');

      const { error } = await supabase
        .from('fan_post_likes')
        .insert({
          fan_post_id: fanPostId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-post-like-status', user?.id, fanPostId] });
      queryClient.invalidateQueries({ queryKey: ['fan-post-like-count', fanPostId] });
      toast({
        title: "Success",
        description: "Fan post liked!",
      });
    },
    onError: (error) => {
      console.error('Error liking fan post:', error);
      toast({
        title: "Error",
        description: "Failed to like fan post",
        variant: "destructive",
      });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !fanPostId) throw new Error('Missing user or fan post');

      const { error } = await supabase
        .from('fan_post_likes')
        .delete()
        .eq('fan_post_id', fanPostId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan-post-like-status', user?.id, fanPostId] });
      queryClient.invalidateQueries({ queryKey: ['fan-post-like-count', fanPostId] });
      toast({
        title: "Success",
        description: "Fan post unliked",
      });
    },
    onError: (error) => {
      console.error('Error unliking fan post:', error);
      toast({
        title: "Error",
        description: "Failed to unlike fan post",
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