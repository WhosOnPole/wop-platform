'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'

interface ChatMessage {
  id: number
  track_id: string
  user_id: string
  message: string
  created_at: string
  display_name: string
}

interface UseChatPollingOptions {
  trackId: string
  enabled?: boolean
  interval?: number // Polling interval in milliseconds (default: 3000)
  onError?: (error: Error) => void
}

interface UseChatPollingReturn {
  messages: ChatMessage[]
  isPolling: boolean
  error: Error | null
}

/**
 * Fallback polling hook for when Realtime is unavailable
 * Polls live_chat_messages table for new messages
 */
export function useChatPolling({
  trackId,
  enabled = true,
  interval = 3000,
  onError,
}: UseChatPollingOptions): UseChatPollingReturn {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastSeenIdRef = useRef<number>(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load initial messages
  useEffect(() => {
    if (!enabled || !trackId) return

    async function loadInitialMessages() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_chat_messages')
          .select('id, track_id, user_id, message, created_at, display_name')
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

  // Poll for new messages
  useEffect(() => {
    if (!enabled || !trackId) {
      setIsPolling(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    setIsPolling(true)

    async function pollMessages() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_chat_messages')
          .select('id, track_id, user_id, message, created_at, display_name')
          .eq('track_id', trackId)
          .is('deleted_at', null)
          .gt('id', lastSeenIdRef.current)
          .order('id', { ascending: true })

        if (fetchError) throw fetchError

        if (data && data.length > 0) {
          setMessages((prev) => {
            // Merge new messages, avoiding duplicates
            const existingIds = new Set(prev.map((m) => m.id))
            const newMessages = data.filter((m) => !existingIds.has(m.id))

            if (newMessages.length === 0) return prev

            const merged = [...prev, ...newMessages].sort((a, b) => a.id - b.id)
            
            // Update last seen ID
            lastSeenIdRef.current = merged[merged.length - 1].id

            return merged
          })
        }

        setError(null)
      } catch (err: any) {
        console.error('Error polling messages:', err)
        setError(err)
        onError?.(err)
      }
    }

    // Poll immediately, then set interval
    pollMessages()
    intervalRef.current = setInterval(pollMessages, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPolling(false)
    }
  }, [trackId, enabled, interval, supabase, onError])

  return {
    messages,
    isPolling,
    error,
  }
}
