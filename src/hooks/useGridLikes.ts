import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useGridLikes = (gridId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user has liked the grid
  const { data: isLiked = false, isLoading } = useQuery({
    queryKey: ['grid-like-status', user?.id, gridId],
    queryFn: async () => {
      if (!user || !gridId) return false;

      const { data, error } = await supabase
        .from('grid_likes')
        .select('id')
        .eq('grid_id', gridId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking like status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!(user && gridId),
  });

  // Get like count for a grid
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['grid-like-count', gridId],
    queryFn: async () => {
      if (!gridId) return 0;

      const { data, error } = await supabase.rpc('get_grid_like_count', {
        target_grid_id: gridId
      });

      if (error) {
        console.error('Error fetching like count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!gridId,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !gridId) throw new Error('Missing user or grid');

      const { error } = await supabase
        .from('grid_likes')
        .insert({
          grid_id: gridId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grid-like-status', user?.id, gridId] });
      queryClient.invalidateQueries({ queryKey: ['grid-like-count', gridId] });
      toast({
        title: "Success",
        description: "Grid liked!",
      });
    },
    onError: (error) => {
      console.error('Error liking grid:', error);
      toast({
        title: "Error",
        description: "Failed to like grid",
        variant: "destructive",
      });
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !gridId) throw new Error('Missing user or grid');

      const { error } = await supabase
        .from('grid_likes')
        .delete()
        .eq('grid_id', gridId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grid-like-status', user?.id, gridId] });
      queryClient.invalidateQueries({ queryKey: ['grid-like-count', gridId] });
      toast({
        title: "Success",
        description: "Grid unliked",
      });
    },
    onError: (error) => {
      console.error('Error unliking grid:', error);
      toast({
        title: "Error",
        description: "Failed to unlike grid",
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