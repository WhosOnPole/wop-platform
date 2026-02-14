'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationDropdown } from './notification-dropdown'

interface NotificationBellProps {
  currentUsername?: string | null
}

export function NotificationBell({ currentUsername }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { hasUnread, unreadCount } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-sunset-gradient`} aria-label="Notifications"
      >
        <Bell
          className={`h-5 w-5 ${
            hasUnread
              ? 'text-sunset-gradient hover:text-white'
              : 'text-white'
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sunset-gradient text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
          <NotificationDropdown
            currentUsername={currentUsername}
            onClose={() => setIsOpen(false)}
          />
        )}
    </div>
  )
}

