'use client'

import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, UserPlus, AtSign, Vote, X } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { getAvatarUrl } from '@/utils/avatar'
import Link from 'next/link'

interface NotificationDropdownProps {
  onClose: () => void
}

const notificationIcons = {
  like_grid: Heart,
  like_post: Heart,
  comment: MessageSquare,
  follow: UserPlus,
  mention: AtSign,
  poll_vote: Vote,
}

const notificationMessages = {
  like_grid: (actor: string) => `${actor} liked your grid`,
  like_post: (actor: string) => `${actor} liked your post`,
  comment: (actor: string) => `${actor} commented on your post`,
  follow: (actor: string) => `${actor} started following you`,
  mention: (actor: string) => `${actor} mentioned you`,
  poll_vote: (actor: string) => `${actor} voted on a poll you're following`,
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  return date.toLocaleDateString()
}

function getNotificationUrl(notification: any): string {
  const { type, target_type, target_id, actor_id, metadata } = notification

  switch (type) {
    case 'like_grid':
      // For grid likes, link to the grid owner's profile if available in metadata
      // Otherwise, link to the actor's profile (person who liked it)
      if (metadata?.grid_owner_username) {
        return `/u/${metadata.grid_owner_username}`
      }
      return `/u/${notification.actor?.username || actor_id}`
    case 'comment':
      // Comments are on posts, so link to the post
      // In a real implementation, we might want a post detail page
      // For now, link to feed or the post owner's profile
      return '/feed'
    case 'like_post':
      // Similar to comments, link to feed or post detail
      return '/feed'
    case 'follow':
      return `/u/${notification.actor?.username || actor_id}`
    case 'mention':
      // Mentions are in posts, link to feed
      return '/feed'
    case 'poll_vote':
      return `/podiums`
    default:
      return '/'
  }
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications({
    limit: 10,
  })

  function handleNotificationClick(notification: any) {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }
    const url = getNotificationUrl(notification)
    router.push(url)
    onClose()
  }

  function handleMarkAllAsRead() {
    markAllAsRead()
  }

  if (isLoading) {
    return (
      <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/20 bg-black shadow-xl">
        <div className="p-4">
          <div className="text-sm text-white/60">Loading notifications...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/20 bg-black shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-[#25B4B1] hover:text-[#3BEFEB]"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-white/60">No notifications yet</p>
            <Link
              href="/notifications"
              className="mt-2 inline-block text-sm text-[#25B4B1] hover:text-[#3BEFEB]"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type]
              const actor = notification.actor?.username || 'Someone'
              const message = notificationMessages[notification.type](actor)
              const isUnread = !notification.read_at

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-white/5 ${
                    isUnread ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <img
                        src={getAvatarUrl(notification.actor?.profile_image_url)}
                        alt={actor}
                        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/20"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/50" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${isUnread ? 'font-semibold text-white' : 'text-white/90'}`}>
                            {message}
                          </p>
                          {notification.metadata?.preview && (
                            <p className="mt-1 text-xs text-white/50 line-clamp-2">
                              {notification.metadata.preview}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-white/40">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#25B4B1]" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-white/20 px-4 py-3">
          <Link
            href="/notifications"
            className="block text-center text-sm text-[#25B4B1] hover:text-[#3BEFEB]"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

