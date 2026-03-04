'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Bell, Mail, Smartphone, Save } from 'lucide-react'

interface NotificationSettingsProps {
  initialPreferences: any
}

export function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const [preferences, setPreferences] = useState({
    email_enabled: initialPreferences?.email_enabled ?? true,
    push_enabled: initialPreferences?.push_enabled ?? false,
    email_frequency: initialPreferences?.email_frequency ?? 'instant',
    notification_types: initialPreferences?.notification_types ?? {
      like_grid: { email: true, push: false },
      like_post: { email: true, push: false },
      comment: { email: true, push: true },
      follow: { email: true, push: false },
      mention: { email: true, push: true },
      poll_vote: { email: false, push: false },
    },
  })

  async function handleSave() {
    setLoading(true)
    setSaved(false)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: session.user.id,
            ...preferences,
          },
          { onConflict: 'user_id' }
        )

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Failed to save preferences:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function updateNotificationType(type: string, field: 'email' | 'push', value: boolean) {
    setPreferences({
      ...preferences,
      notification_types: {
        ...preferences.notification_types,
        [type]: {
          ...preferences.notification_types[type],
          [field]: value,
        },
      },
    })
  }

  const notificationTypeLabels: Record<string, string> = {
    like_grid: 'Grid Likes',
    like_post: 'Post Likes',
    comment: 'Comments',
    follow: 'New Followers',
    mention: 'Mentions',
    poll_vote: 'Poll Votes',
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <div className="rounded-lg border border-white/20 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Global Settings</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-sm text-white/70">Receive notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) =>
                  setPreferences({ ...preferences, email_enabled: e.target.checked })
                }
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-white/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#25B4B1] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-white/60" />
              <div>
                <p className="font-medium text-white">Push Notifications</p>
                <p className="text-sm text-white/70">Receive push notifications (coming soon)</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) =>
                  setPreferences({ ...preferences, push_enabled: e.target.checked })
                }
                disabled
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-white/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white/30 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#25B4B1] peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50"></div>
            </label>
          </div>

          {preferences.email_enabled && (
            <div>
              <label className="block text-sm font-medium text-white/90">
                Email Frequency
              </label>
              <select
                value={preferences.email_frequency}
                onChange={(e) =>
                  setPreferences({ ...preferences, email_frequency: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] [color-scheme:dark]"
              >
                <option value="instant">Instant - Send immediately</option>
                <option value="digest">Digest - Send once per day</option>
                <option value="weekly">Weekly - Send once per week</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Per-Type Settings */}
      {preferences.email_enabled && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Notification Types</h2>
          <p className="mb-4 text-sm text-white/70">
            Customize which types of notifications you receive
          </p>

          <div className="space-y-4">
            {Object.entries(preferences.notification_types).map(([type, settings]: [string, any]) => (
              <div key={type} className="flex items-center justify-between border-b border-white/10 pb-4 last:border-0">
                <div>
                  <p className="font-medium text-white">{notificationTypeLabels[type]}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email}
                      onChange={(e) => updateNotificationType(type, 'email', e.target.checked)}
                      className="rounded border-white/30 bg-white/10 text-[#25B4B1] focus:ring-[#25B4B1]"
                    />
                    <span className="text-sm text-white/80">Email</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push}
                      onChange={(e) => updateNotificationType(type, 'push', e.target.checked)}
                      disabled
                      className="rounded border-white/30 bg-white/10 text-[#25B4B1] focus:ring-[#25B4B1] disabled:opacity-50"
                    />
                    <span className="text-sm text-white/80">Push</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center space-x-2 rounded-md bg-[#25B4B1] px-6 py-2 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  )
}

