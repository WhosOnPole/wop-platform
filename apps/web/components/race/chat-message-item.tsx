'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MoreVertical, Flag, Trash2, User } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { ChatReportButton } from './chat-report-button'

interface ChatMessage {
  id: number
  track_id: string
  user_id: string
  message: string
  created_at: string
  display_name: string
}

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
  isAdmin: boolean
  onDelete?: (messageId: number) => void
}

export function ChatMessageItem({
  message,
  isOwnMessage,
  isAdmin,
  onDelete,
}: ChatMessageItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Long press handler (mobile)
  function handleTouchStart() {
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true)
    }, 500) // 500ms long press
  }

  function handleTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Right-click handler (desktop)
  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setShowMenu(true)
  }

  // Get user profile URL (need to fetch username from user_id)
  // For now, we'll use display_name which should be the username
  const profileUrl = `/u/${message.display_name}`

  // Format timestamp
  const timestamp = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  async function handleDelete() {
    if (!isAdmin || !onDelete) return

    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await onDelete(message.id)
        setShowMenu(false)
      } catch (error) {
        console.error('Error deleting message:', error)
        alert('Failed to delete message')
      }
    }
  }

  function handleViewProfile() {
    router.push(profileUrl)
    setShowMenu(false)
  }

  return (
    <>
      <div
        className={`group flex items-start space-x-3 ${
          isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 ${
            isOwnMessage ? 'bg-blue-500' : ''
          }`}
        >
          <span className="text-xs font-medium text-gray-600">
            {message.display_name?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>

        {/* Message content */}
        <div
          className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}
        >
          <div className="flex items-center space-x-2">
            <Link
              href={profileUrl}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {message.display_name || 'Unknown'}
            </Link>
            <span className="text-xs text-gray-500">{timestamp}</span>
          </div>
          <p
            className={`mt-1 text-sm text-gray-700 ${
              isOwnMessage ? 'text-right' : ''
            }`}
          >
            {message.message}
          </p>
        </div>

        {/* Menu button (desktop hover) */}
        <div className="relative shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label="Message options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Context menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
            >
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowReportModal(true)
                    setShowMenu(false)
                  }}
                  className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Flag className="h-4 w-4" />
                  <span>Report</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={handleViewProfile}
                      className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      <span>View Profile</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReportModal && (
        <ChatReportButton
          messageId={message.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  )
}
