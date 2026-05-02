'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  user_id: string
  type: 'like_grid' | 'like_post' | 'comment' | 'follow' | 'mention' | 'poll_vote'
  actor_id: string
  target_type: 'grid' | 'post' | 'comment' | 'profile' | 'poll' | 'grid_slot_comment'
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
      const notifications = (data || []) as Notification[]
      if (notifications.length === 0) return notifications

      const gridIds = [
        ...new Set(
          notifications
            .filter((n) => n.target_type === 'grid')
            .map((n) => n.target_id)
        ),
      ]
      const gridSlotCommentIds = [
        ...new Set(
          notifications
            .filter((n) => n.target_type === 'grid_slot_comment')
            .map((n) => n.target_id)
        ),
      ]
      const commentIds = [
        ...new Set(
          notifications
            .filter((n) => n.target_type === 'comment')
            .map((n) => n.target_id)
        ),
      ]

      const [gridRows, gridSlotRows, commentRows] = await Promise.all([
        gridIds.length > 0
          ? supabase
              .from('grids')
              .select('id, type')
              .in('id', gridIds)
          : Promise.resolve({ data: [] as Array<{ id: string; type: string }> }),
        gridSlotCommentIds.length > 0
          ? supabase
              .from('grid_slot_comments')
              .select(
                `
                id,
                grid_id,
                rank_index,
                content,
                grid:grids!grid_id (
                  id,
                  type
                )
              `
              )
              .in('id', gridSlotCommentIds)
          : Promise.resolve({
              data: [] as Array<{
                id: string
                grid_id: string
                rank_index: number
                content: string
                grid: { id: string; type: string } | Array<{ id: string; type: string }> | null
              }>,
            }),
        commentIds.length > 0
          ? supabase
              .from('comments')
              .select('id, content')
              .in('id', commentIds)
          : Promise.resolve({ data: [] as Array<{ id: string; content: string }> }),
      ])

      const gridTypeLabel = (t?: string | null) =>
        t === 'driver' ? 'Drivers' : t === 'team' ? 'Teams' : t === 'track' ? 'Tracks' : 'Grid'

      const gridById = new Map((gridRows.data || []).map((g) => [g.id, g]))
      const gridSlotById = new Map(
        (gridSlotRows.data || []).map((row) => {
          const grid = Array.isArray(row.grid) ? row.grid[0] : row.grid
          return [
            row.id,
            {
              ...row,
              grid,
            },
          ]
        })
      )
      const commentById = new Map((commentRows.data || []).map((c) => [c.id, c]))

      return notifications.map((notification) => {
        const metadata = { ...(notification.metadata || {}) } as Record<string, any>

        if (notification.target_type === 'grid') {
          const grid = gridById.get(notification.target_id)
          if (grid) {
            metadata.grid_id = grid.id
            metadata.grid_type = grid.type
            metadata.context_label =
              typeof metadata.rank_index === 'number'
                ? `${gridTypeLabel(grid.type)} grid · Position #${metadata.rank_index}`
                : `${gridTypeLabel(grid.type)} grid`
          }
        }

        if (notification.target_type === 'grid_slot_comment') {
          const slot = gridSlotById.get(notification.target_id)
          if (slot) {
            metadata.grid_id = slot.grid_id
            metadata.grid_type = slot.grid?.type ?? metadata.grid_type
            metadata.rank_index = slot.rank_index
            metadata.context_label = `${gridTypeLabel(slot.grid?.type)} grid · Position #${slot.rank_index}`
            if (!metadata.preview && slot.content) {
              metadata.preview = slot.content
            }
          }
        }

        if (notification.target_type === 'comment') {
          const comment = commentById.get(notification.target_id)
          if (comment && !metadata.preview) {
            metadata.preview = comment.content
          }
        }

        return {
          ...notification,
          metadata,
        }
      })
    },
    staleTime: 60_000, // Consider fresh for 60s
    refetchInterval: 60_000, // Refetch every 60s (was 30s)
  })

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    staleTime: 60_000, // Consider fresh for 60s
    refetchInterval: 60_000, // 60s (was 30s) - halves RPC calls
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
  })

  // Update hasUnread state
  useEffect(() => {
    setHasUnread(unreadCount > 0)
  }, [unreadCount])

  // Set up real-time subscription (unsubscribe when tab hidden to reduce realtime load)
  useEffect(() => {
    const channelRef = { current: null as ReturnType<typeof supabase.channel> | null }
    let visibilityCleanup: (() => void) | null = null

    async function setupSubscription() {
      visibilityCleanup?.()
      visibilityCleanup = null

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const ch = supabase
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
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
          }
        )
        .subscribe()

      channelRef.current = ch

      function handleVisibilityChange() {
        if (document.visibilityState === 'hidden' && channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        } else if (document.visibilityState === 'visible' && !channelRef.current) {
          setupSubscription()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      visibilityCleanup = () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    setupSubscription()

    return () => {
      visibilityCleanup?.()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
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

