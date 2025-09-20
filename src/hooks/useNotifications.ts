import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  payload: any;
  read_at: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data as Notification[];
    },
    enabled: !!user,
  });

  // Get unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};