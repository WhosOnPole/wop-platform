import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useFollow = (targetUserId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if current user is following the target user
  const { data: isFollowing = false, isLoading } = useQuery({
    queryKey: ['follow-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return false;

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('followee_id', targetUserId)
        .maybeSingle();

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!(user && targetUserId && user.id !== targetUserId),
  });

  // Get follow counts for a user
  const { data: followCounts } = useQuery({
    queryKey: ['follow-counts', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return { follower_count: 0, following_count: 0 };

      const { data, error } = await supabase.rpc('get_follow_counts', {
        user_uuid: targetUserId
      });

      if (error) {
        console.error('Error fetching follow counts:', error);
        return { follower_count: 0, following_count: 0 };
      }

      return data[0] || { follower_count: 0, following_count: 0 };
    },
    enabled: !!targetUserId,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !targetUserId) throw new Error('Missing user or target');

      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          followee_id: targetUserId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', targetUserId] });
      toast({
        title: "Success",
        description: "Started following user",
      });
    },
    onError: (error) => {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !targetUserId) throw new Error('Missing user or target');

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', targetUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', user?.id, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', targetUserId] });
      toast({
        title: "Success", 
        description: "Unfollowed user",
      });
    },
    onError: (error) => {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: "Failed to unfollow user",
        variant: "destructive",
      });
    },
  });

  const toggleFollow = () => {
    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  return {
    isFollowing,
    isLoading,
    followCounts,
    toggleFollow,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
  };
};