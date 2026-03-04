'use client'

import { useState, useEffect } from 'react'
import { useNotificationPreferences } from '@/hooks/use-notification-preferences'
import { Bell, Mail, Smartphone } from 'lucide-react'

interface NotificationPreferences {
  user_id: string
  email_likes: boolean
  email_comments: boolean
  email_follows: boolean
  email_mentions: boolean
  email_poll_votes: boolean
  push_enabled: boolean
  created_at: string
  updated_at: string
}

type ToggleableField = 
  | 'email_likes'
  | 'email_comments'
  | 'email_follows'
  | 'email_mentions'
  | 'email_poll_votes'
  | 'push_enabled'

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences()
  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(preferences || null)

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences)
    }
  }, [preferences])

  function handleToggle(field: ToggleableField) {
    if (!localPrefs) return

    const newValue = !localPrefs[field]
    setLocalPrefs({ ...localPrefs, [field]: newValue })
    updatePreferences({ [field]: newValue })
  }

  const toggleClass = (on: boolean) =>
    `relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#25B4B1] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 ${
      on ? 'bg-[#25B4B1]' : 'bg-white/20'
    }`
  const thumbClass = (on: boolean) =>
    `pointer-events-none absolute left-[2px] top-[2px] inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
      on ? 'translate-x-5' : 'translate-x-0'
    }`

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/5 p-12 text-center">
        <div className="text-white/70">Loading preferences...</div>
      </div>
    )
  }

  if (!preferences || !localPrefs) {
    return (
      <div className="rounded-lg border border-white/20 bg-white/5 p-12 text-center">
        <div className="text-white/70">Failed to load preferences</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Notification Preferences</h1>
        <p className="mt-2 text-white/80">Manage how you receive notifications</p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications Section */}
        <div className="rounded-lg border border-white/20 bg-white/5 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Mail className="h-5 w-5 text-white/60" />
            <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
          </div>
          <p className="mb-4 text-sm text-white/70">
            Choose which notifications you want to receive via email
          </p>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-white">Likes</div>
                <div className="text-sm text-white/70">When someone likes your grid or post</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localPrefs.email_likes}
                onClick={() => handleToggle('email_likes')}
                disabled={isUpdating}
                className={toggleClass(localPrefs.email_likes)}
              >
                <span className={thumbClass(localPrefs.email_likes)} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-white">Comments</div>
                <div className="text-sm text-white/70">When someone comments on your post</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localPrefs.email_comments}
                onClick={() => handleToggle('email_comments')}
                disabled={isUpdating}
                className={toggleClass(localPrefs.email_comments)}
              >
                <span className={thumbClass(localPrefs.email_comments)} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-white">Follows</div>
                <div className="text-sm text-white/70">When someone starts following you</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localPrefs.email_follows}
                onClick={() => handleToggle('email_follows')}
                disabled={isUpdating}
                className={toggleClass(localPrefs.email_follows)}
              >
                <span className={thumbClass(localPrefs.email_follows)} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-white">Mentions</div>
                <div className="text-sm text-white/70">When someone mentions you in a post</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localPrefs.email_mentions}
                onClick={() => handleToggle('email_mentions')}
                disabled={isUpdating}
                className={toggleClass(localPrefs.email_mentions)}
              >
                <span className={thumbClass(localPrefs.email_mentions)} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-medium text-white">Poll Votes</div>
                <div className="text-sm text-white/70">When someone votes on a poll you're following</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localPrefs.email_poll_votes}
                onClick={() => handleToggle('email_poll_votes')}
                disabled={isUpdating}
                className={toggleClass(localPrefs.email_poll_votes)}
              >
                <span className={thumbClass(localPrefs.email_poll_votes)} />
              </button>
            </label>
          </div>
        </div>

        {/* Push Notifications Section */}
        <div className="rounded-lg border border-white/20 bg-white/5 p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-white/60" />
            <h2 className="text-lg font-semibold text-white">Push Notifications</h2>
          </div>
          <p className="mb-4 text-sm text-white/70">
            Receive push notifications in your browser (coming soon)
          </p>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium text-white">Enable Push Notifications</div>
              <div className="text-sm text-white/70">Get notified even when you're not on the site</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={localPrefs.push_enabled}
              onClick={() => handleToggle('push_enabled')}
              disabled={isUpdating || true}
              className={toggleClass(localPrefs.push_enabled)}
            >
              <span className={thumbClass(localPrefs.push_enabled)} />
            </button>
          </label>
        </div>
      </div>
    </div>
  )
}

