'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [status, setStatus] = useState<ChatStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const deletedMessageIdsRef = useRef<Set<number>>(new Set())
  const lastSeenIdRef = useRef<number>(0)

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

  // Get chat status and connect to realtime
  useEffect(() => {
    if (!enabled || !trackId) {
      setIsConnected(false)
      return
    }

    let mounted = true
    let channel: RealtimeChannel | null = null

    async function connect() {
      try {
        // Get chat status first
        const chatStatus = await getChatStatus(trackId, supabase)
        
        if (!mounted) return

        setStatus(chatStatus)

        // Only connect if chat is open or read_only
        if (chatStatus.mode !== 'open' && chatStatus.mode !== 'read_only') {
          setIsConnected(false)
          return
        }

        // Create private channel
        const topic = `f1:race:${trackId}`
        channel = supabase.channel(topic, {
          config: {
            private: true, // Required for Realtime Authorization
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

        // Subscribe to channel
        channel.subscribe((status) => {
          if (!mounted) return

          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setError(null)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false)
            const err = new Error(`Channel ${status}`)
            setError(err)
            onError?.(err)
          }
        })

        channelRef.current = channel
      } catch (err: any) {
        if (!mounted) return
        console.error('Error connecting to chat:', err)
        setError(err)
        setIsConnected(false)
        onError?.(err)
      }
    }

    connect()

    return () => {
      mounted = false
      if (channel) {
        supabase.removeChannel(channel)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [trackId, enabled, supabase, onError])

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
          throw new Error(rpcError.message || 'Failed to send message')
        }

        // Message will appear via broadcast, but we can optimistically add it
        // if the RPC returns the inserted row
        if (data && data.length > 0) {
          const newMessage = data[0] as ChatMessage
          setMessages((prev) => {
            // Avoid duplicates
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
    status,
    error,
  }
}
