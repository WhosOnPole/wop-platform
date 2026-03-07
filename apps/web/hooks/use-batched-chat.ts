'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getChatStatus, type ChatStatus } from '@/utils/race-weekend'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatMessage {
  id: number
  track_id: string
  user_id: string
  message: string
  created_at: string
  display_name: string
  client_nonce?: string
}

interface UseBatchedChatOptions {
  trackId: string
  enabled?: boolean
  onError?: (error: Error) => void
}

interface UseBatchedChatReturn {
  messages: ChatMessage[]
  sendMessage: (message: string, clientNonce?: string) => Promise<void>
  deleteMessage: (messageId: number) => Promise<void>
  isConnected: boolean
  onlineCount: number
  status: ChatStatus | null
  error: Error | null
}

export function useBatchedChat({
  trackId,
  enabled = true,
  onError,
}: UseBatchedChatOptions): UseBatchedChatReturn {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const deletedMessageIdsRef = useRef<Set<number>>(new Set())
  const lastSeenIdRef = useRef<number>(0)

  // Cache get_chat_status for 5 min (reduces RPC calls on remount/navigation)
  const { data: chatStatus } = useQuery({
    queryKey: ['chat-status', trackId],
    queryFn: () => getChatStatus(trackId, supabase),
    enabled: !!enabled && !!trackId,
    staleTime: 5 * 60 * 1000,
  })

  // Load initial messages
  useEffect(() => {
    if (!enabled || !trackId) return

    async function loadInitialMessages() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_chat_messages')
          .select('id, track_id, user_id, message, created_at, display_name, client_nonce')
          .eq('track_id', trackId)
          .is('deleted_at', null)
          .order('id', { ascending: false })
          .limit(100)

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          const sorted = [...data].reverse() // Reverse to chronological order
          setMessages(sorted)
          lastSeenIdRef.current = sorted[sorted.length - 1]?.id || 0
        }
      } catch (err: any) {
        console.error('Error loading initial messages:', err)
        setError(err)
        onError?.(err)
      }
    }

    loadInitialMessages()
  }, [trackId, enabled, supabase, onError])

  // Sync status from cached query
  useEffect(() => {
    setStatus(chatStatus ?? null)
  }, [chatStatus])

  // Connect to realtime (unsubscribe when tab hidden to reduce realtime.list_changes)
  const updatePresenceCount = useCallback((ch: RealtimeChannel | null) => {
    if (!ch) {
      setOnlineCount(0)
      return
    }
    const state = ch.presenceState() as Record<string, unknown[]>
    // Count unique presence keys (typically one key per user).
    setOnlineCount(Object.keys(state).length)
  }, [])

  useEffect(() => {
    if (!enabled || !trackId || !chatStatus) {
      setIsConnected(false)
      setOnlineCount(0)
      return
    }

    if (chatStatus.mode !== 'open' && chatStatus.mode !== 'read_only') {
      setIsConnected(false)
      setOnlineCount(0)
      return
    }

    let mounted = true
    let channel: RealtimeChannel | null = null
    let isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    let visibilityCleanup: (() => void) | null = null

    async function connect() {
      try {
        visibilityCleanup?.()
        visibilityCleanup = null

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setIsConnected(false)
          return
        }

        if (!mounted || !isVisible) return

        // Create channel
        // Note: If Realtime Authorization is not enabled, remove private: true
        const topic = `f1:race:${trackId}`
        channel = supabase.channel(topic, {
          config: {
            presence: { key: session.user.id },
            // private: true, // Uncomment when Realtime Authorization is enabled
          },
        })

        // Listen for batched messages
        channel.on(
          'broadcast',
          { event: 'chat_batch' },
          (payload) => {
            if (!mounted) return

            try {
              const batch = payload.payload as {
                messages: ChatMessage[]
                track_id: string
                timestamp: string
              }

              if (batch.messages && Array.isArray(batch.messages)) {
                setMessages((prev) => {
                  // Filter out deleted messages and duplicates
                  const newMessages = batch.messages.filter(
                    (msg) =>
                      !deletedMessageIdsRef.current.has(msg.id) &&
                      !prev.some((m) => m.id === msg.id)
                  )

                  if (newMessages.length === 0) return prev

                  // Merge and sort by id
                  const merged = [...prev, ...newMessages].sort((a, b) => a.id - b.id)
                  
                  // Update last seen ID
                  if (merged.length > 0) {
                    lastSeenIdRef.current = Math.max(
                      lastSeenIdRef.current,
                      merged[merged.length - 1].id
                    )
                  }

                  return merged
                })
              }
            } catch (err) {
              console.error('Error processing chat batch:', err)
            }
          }
        )

        // Listen for delete events
        channel.on(
          'broadcast',
          { event: 'message_deleted' },
          (payload) => {
            if (!mounted) return

            try {
              const deleteEvent = payload.payload as {
                type: 'delete'
                messageId: number
                track_id: string
                deletedBy: string
                timestamp: string
              }

              deletedMessageIdsRef.current.add(deleteEvent.messageId)

              // Remove from messages
              setMessages((prev) => prev.filter((m) => m.id !== deleteEvent.messageId))
            } catch (err) {
              console.error('Error processing delete event:', err)
            }
          }
        )

        channel.on('presence', { event: 'sync' }, () => {
          if (!mounted) return
          updatePresenceCount(channel)
        })
        channel.on('presence', { event: 'join' }, () => {
          if (!mounted) return
          updatePresenceCount(channel)
        })
        channel.on('presence', { event: 'leave' }, () => {
          if (!mounted) return
          updatePresenceCount(channel)
        })

        // Subscribe to channel
        channel.subscribe((status, err) => {
          if (!mounted) return

          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setError(null)
            channel
              ?.track({ online_at: new Date().toISOString() })
              .catch((presenceErr) => {
                console.error('Error tracking chat presence:', presenceErr)
              })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setIsConnected(false)
            setOnlineCount(0)
            const error = err || new Error(`Channel ${status}`)
            setError(error)
            console.error('Channel subscription error:', status, err)
            onError?.(error)
          } else if (status === 'CLOSED') {
            setIsConnected(false)
            setOnlineCount(0)
            console.warn('Channel closed')
          }
        })

        channelRef.current = channel

        function handleVisibilityChange() {
          isVisible = document.visibilityState === 'visible'
          const ch = channelRef.current
          if (!isVisible && ch) {
            supabase.removeChannel(ch)
            channelRef.current = null
            setIsConnected(false)
            setOnlineCount(0)
          } else if (isVisible && mounted && !channelRef.current) {
            connect()
          }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        visibilityCleanup = () => document.removeEventListener('visibilitychange', handleVisibilityChange)
      } catch (err: any) {
        if (!mounted) return
        console.error('Error connecting to chat:', err)
        setError(err)
        setIsConnected(false)
        setOnlineCount(0)
        onError?.(err)
      }
    }

    connect()

    return () => {
      mounted = false
      visibilityCleanup?.()
      const ch = channelRef.current
      if (ch) {
        supabase.removeChannel(ch)
        channelRef.current = null
      }
      setIsConnected(false)
      setOnlineCount(0)
    }
  }, [trackId, enabled, chatStatus, supabase, onError, updatePresenceCount])

  // Send message via RPC
  const sendMessage = useCallback(
    async (message: string, clientNonce?: string) => {
      if (!trackId || !message.trim()) return

      try {
        // Generate client nonce if not provided
        const nonce = clientNonce || crypto.randomUUID()

        const { data, error: rpcError } = await supabase.rpc('send_chat_message', {
          p_track_id: trackId,
          p_message: message.trim(),
          p_client_nonce: nonce,
        })

        if (rpcError) {
          console.error('RPC error details:', rpcError)
          throw new Error(rpcError.message || rpcError.details || 'Failed to send message')
        }

        // Message will appear via broadcast, but we can optimistically add it
        // if the RPC returns the inserted row
        if (data && Array.isArray(data) && data.length > 0) {
          const newMessage = data[0] as ChatMessage
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage].sort((a, b) => a.id - b.id)
          })
        } else if (data && !Array.isArray(data)) {
          // Handle case where function returns a single row object
          const newMessage = data as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage].sort((a, b) => a.id - b.id)
          })
        }
      } catch (err: any) {
        console.error('Error sending message:', err)
        setError(err)
        onError?.(err)
        throw err
      }
    },
    [trackId, supabase, onError]
  )

  // Delete message (admin only)
  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        const { error: rpcError } = await supabase.rpc('delete_chat_message', {
          p_message_id: messageId,
        })

        if (rpcError) {
          throw new Error(rpcError.message || 'Failed to delete message')
        }

        // Message will be removed via broadcast, but optimistically remove it
        deletedMessageIdsRef.current.add(messageId)
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
      } catch (err: any) {
        console.error('Error deleting message:', err)
        setError(err)
        onError?.(err)
        throw err
      }
    },
    [supabase, onError]
  )

  return {
    messages,
    sendMessage,
    deleteMessage,
    isConnected,
    onlineCount,
    status,
    error,
  }
}
