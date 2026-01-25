'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Send, MessageSquare, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useBatchedChat } from '@/hooks/use-batched-chat'
import { useChatPolling } from '@/hooks/use-chat-polling'
import { ChatMessageItem } from './chat-message-item'
import type { ChatStatus } from '@/utils/race-weekend'

interface RealtimeChatBatchedProps {
  trackId: string
  raceName?: string
}

export function RealtimeChatBatched({ trackId, raceName }: RealtimeChatBatchedProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [usePolling, setUsePolling] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get current user and admin status
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setCurrentUserId(session.user.id)

        // Check if admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .single()

        const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
        const isAdminRole = profile?.role === 'admin'
        setIsAdmin(isAdminEmail || isAdminRole || false)
      }
    }

    loadUser()
  }, [supabase])

  // Use batched chat hook (primary)
  const {
    messages: batchedMessages,
    sendMessage,
    deleteMessage,
    isConnected,
    status,
    error: chatError,
  } = useBatchedChat({
    trackId,
    enabled: !usePolling,
    onError: (error) => {
      console.error('Batched chat error, falling back to polling:', error)
      // Fallback to polling if realtime fails
      if (!usePolling) {
        setUsePolling(true)
      }
    },
  })

  // Use polling hook (fallback)
  const {
    messages: polledMessages,
    isPolling,
    error: pollingError,
  } = useChatPolling({
    trackId,
    enabled: usePolling,
  })

  // Use appropriate messages source
  const messages = usePolling ? polledMessages : batchedMessages
  const isConnectedState = usePolling ? isPolling : isConnected

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Determine chat state
  const isChatActive = status?.mode === 'open' || status?.mode === 'read_only'
  const isReadOnly = status?.mode === 'read_only'
  const isChatClosed = status?.mode === 'closed' || !isChatActive

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || isChatClosed || isReadOnly || isSubmitting) return

    setIsSubmitting(true)
    try {
      await sendMessage(newMessage.trim())
      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.message || 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteMessage(messageId: number) {
    try {
      await deleteMessage(messageId)
    } catch (error: any) {
      console.error('Error deleting message:', error)
      alert(error.message || 'Failed to delete message')
      throw error
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {raceName ? `${raceName} Chat` : 'Live Chat'}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            {/* Connection status */}
            {usePolling ? (
              <div className="flex items-center space-x-1 text-sm text-yellow-600">
                <WifiOff className="h-4 w-4" />
                <span>Polling</span>
              </div>
            ) : isConnectedState ? (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Wifi className="h-4 w-4" />
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <WifiOff className="h-4 w-4" />
                <span>Connecting...</span>
              </div>
            )}

            {/* Chat status */}
            {isReadOnly && (
              <div className="flex items-center space-x-1 text-sm text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <span>Read-only</span>
              </div>
            )}
            {isChatClosed && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {status?.reason || 'Chat inactive'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">
            {isChatClosed
              ? 'Chat is not available at this time.'
              : 'No messages yet. Be the first to chat!'}
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.user_id === currentUserId}
                isAdmin={isAdmin}
                onDelete={isAdmin ? handleDeleteMessage : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      {!isChatClosed && (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
          {isReadOnly && (
            <p className="mb-2 text-sm text-yellow-600">
              Chat is read-only. You can view messages but cannot send new ones.
            </p>
          )}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isReadOnly ? 'Chat is read-only' : 'Type a message...'}
              maxLength={500}
              disabled={isReadOnly || isSubmitting}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-[#838383] focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required={!isReadOnly}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim() || isReadOnly}
              className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {newMessage.length}/500 characters
            {status?.slow_mode_ms && (
              <span className="ml-2">
                • Slow mode: {status.slow_mode_ms / 1000}s
              </span>
            )}
          </p>
        </form>
      )}
    </div>
  )
}
