'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageSquare, UserPlus, AtSign, Vote, Settings, Check } from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import Link from 'next/link'
import { getAvatarUrl } from '@/utils/avatar'

type FilterType = 'all' | 'unread' | 'likes' | 'comments' | 'follows'

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

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications({
    limit: 50,
    unreadOnly: filter === 'unread',
  })

  // Filter notifications by type
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notification.read_at
    if (filter === 'likes') return notification.type === 'like_grid' || notification.type === 'like_post'
    if (filter === 'comments') return notification.type === 'comment'
    if (filter === 'follows') return notification.type === 'follow'
    return true
  })

  function handleNotificationClick(notification: any) {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }
    const url = getNotificationUrl(notification)
    router.push(url)
  }

  function handleMarkAllAsRead() {
    markAllAsRead()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white font-display">Notifications</h1>
              <p className="mt-2 text-white/70">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  <Check className="h-4 w-4" />
                  <span>Mark all as read</span>
                </button>
              )}
              <Link
                href="/notifications/settings"
                className="flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-white/20">
          <nav className="-mb-px flex gap-6">
            {(['unread', 'likes', 'comments', 'follows', 'all'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize transition-colors w-1/5 text-center ${
                  filter === filterType
                    ? 'border-[#25B4B1] text-[#25B4B1]'
                    : 'border-transparent text-white/60 hover:border-white/30 hover:text-white/90'
                }`}
              >
                {filterType === 'all' ? 'All' : filterType}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="rounded-2xl border border-white/20 bg-white/5 p-12 text-center">
            <div className="text-white/60">Loading notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/5 p-12 text-center">
            <p className="text-white/60">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const Icon = notificationIcons[notification.type]
              const actor = notification.actor?.username || 'Someone'
              const message = notificationMessages[notification.type](actor)
              const isUnread = !notification.read_at

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors hover:bg-white/5 ${
                    isUnread ? 'border-[#25B4B1]/40 bg-white/5' : 'border-white/20 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={getAvatarUrl(notification.actor?.profile_image_url)}
                        alt={actor}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-white/20"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/50" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-base ${isUnread ? 'font-semibold text-white' : 'text-white/90'}`}>
                            {message}
                          </p>
                          {notification.metadata?.preview && (
                            <p className="mt-1 text-sm text-white/50 line-clamp-2">
                              {notification.metadata.preview}
                            </p>
                          )}
                          <p className="mt-1 text-sm text-white/40">{formatTimeAgo(notification.created_at)}</p>
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
    </div>
  )
}

