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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  if (!preferences || !localPrefs) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <div className="text-gray-500">Failed to load preferences</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">Manage how you receive notifications</p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Mail className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Choose which notifications you want to receive via email
          </p>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Likes</div>
                <div className="text-sm text-gray-500">When someone likes your grid or post</div>
              </div>
              <button
                onClick={() => handleToggle('email_likes')}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  localPrefs.email_likes ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localPrefs.email_likes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Comments</div>
                <div className="text-sm text-gray-500">When someone comments on your post</div>
              </div>
              <button
                onClick={() => handleToggle('email_comments')}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  localPrefs.email_comments ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localPrefs.email_comments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Follows</div>
                <div className="text-sm text-gray-500">When someone starts following you</div>
              </div>
              <button
                onClick={() => handleToggle('email_follows')}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  localPrefs.email_follows ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localPrefs.email_follows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Mentions</div>
                <div className="text-sm text-gray-500">When someone mentions you in a post</div>
              </div>
              <button
                onClick={() => handleToggle('email_mentions')}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  localPrefs.email_mentions ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localPrefs.email_mentions ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Poll Votes</div>
                <div className="text-sm text-gray-500">When someone votes on a poll you're following</div>
              </div>
              <button
                onClick={() => handleToggle('email_poll_votes')}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  localPrefs.email_poll_votes ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    localPrefs.email_poll_votes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Push Notifications Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Receive push notifications in your browser (coming soon)
          </p>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Enable Push Notifications</div>
              <div className="text-sm text-gray-500">Get notified even when you're not on the site</div>
            </div>
            <button
              onClick={() => handleToggle('push_enabled')}
              disabled={isUpdating || true} // Disabled until implemented
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                localPrefs.push_enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  localPrefs.push_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  )
}

