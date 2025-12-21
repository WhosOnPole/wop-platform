'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  user_id: string
  type: 'like_grid' | 'like_post' | 'comment' | 'follow' | 'mention' | 'poll_vote'
  actor_id: string
  target_type: 'grid' | 'post' | 'comment' | 'profile' | 'poll'
  target_id: string
  read_at: string | null
  metadata: Record<string, any>
  created_at: string
  actor?: {
    id: string
    username: string
    profile_image_url: string | null
  }
}

interface UseNotificationsOptions {
  limit?: number
  unreadOnly?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 20, unreadOnly = false } = options
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()
  const [hasUnread, setHasUnread] = useState(false)

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', { unreadOnly, limit }],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return []
      }

      let query = supabase
        .from('notifications')
        .select(
          `
          *,
          actor:profiles!actor_id (
            id,
            username,
            profile_image_url
          )
        `
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (unreadOnly) {
        query = query.is('read_at', null)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`)
      }

      return (data || []) as Notification[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return 0
      }

      const { data, error } = await supabase
        .rpc('get_unread_notification_count', { user_uuid: session.user.id })

      if (error) {
        throw new Error(`Failed to fetch unread count: ${error.message}`)
      }

      return (data as number) || 0
    },
    refetchInterval: 30000,
  })

  // Update hasUnread state
  useEffect(() => {
    setHasUnread(unreadCount > 0)
  }, [unreadCount])

  // Set up real-time subscription
  useEffect(() => {
    let channel: any = null

    async function setupSubscription() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            // Invalidate queries to refetch
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, queryClient])

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase.rpc('mark_notification_as_read', {
        notification_uuid: notificationId,
        user_uuid: session.user.id,
      })

      if (error) {
        throw new Error(`Failed to mark notification as read: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        user_uuid: session.user.id,
      })

      if (error) {
        throw new Error(`Failed to mark all as read: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  return {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  }
}

