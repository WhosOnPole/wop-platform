'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getAvatarUrl } from '@/utils/avatar'
import { useRouter } from 'next/navigation'
import { Send, MessageSquare, AlertCircle } from 'lucide-react'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

interface ChatMessage {
  id: number
  message: string
  created_at: string
  user: User | null
}

interface LiveChatComponentProps {
  trackId: string
  raceTime: Date | null
}

export function LiveChatComponent({ trackId, raceTime }: LiveChatComponentProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChatEnded, setIsChatEnded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if chat has ended (24 hours after race time)
    if (raceTime) {
      const chatEndTime = new Date(raceTime.getTime() + 24 * 60 * 60 * 1000)
      if (new Date() > chatEndTime) {
        setIsChatEnded(true)
      }
    }

    // Load initial messages
    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`race-${trackId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `track_id=eq.${trackId}`,
        },
        (payload) => {
          // Fetch the full message with user data
          supabase
            .from('live_chat_messages')
            .select(
              `
              *,
              user:profiles!user_id (
                id,
                username,
                profile_image_url
              )
            `
            )
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setMessages((prev) => [...prev, data as ChatMessage])
              }
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [trackId, raceTime])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages() {
    const { data } = await supabase
      .from('live_chat_messages')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('track_id', trackId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data as ChatMessage[])
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || isChatEnded) return

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('live_chat_messages').insert({
      user_id: session.user.id,
      track_id: trackId,
      message: newMessage.trim(),
    })

    if (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } else {
      setNewMessage('')
    }
    setIsSubmitting(false)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Live Chat</h2>
          </div>
          {isChatEnded && (
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>Chat has ended</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet. Be the first to chat!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                <img
                  src={getAvatarUrl(message.user?.profile_image_url)}
                  alt={message.user?.username ?? ''}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {message.user?.username || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      {!isChatEnded && (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim()}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {newMessage.length}/1000 characters
          </p>
        </form>
      )}
    </div>
  )
}

