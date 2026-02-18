'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar, MessageSquare, Users, Power, PowerOff, Clock } from 'lucide-react'
import Link from 'next/link'

interface RaceWeekendWidgetProps {
  initialRace: any
  initialMetrics: {
    totalMessages: number
    activeUsers: number
    messagesPerMinute: number
  } | null
}

export function RaceWeekendWidget({
  initialRace,
  initialMetrics,
}: RaceWeekendWidgetProps) {
  const supabase = createClientComponentClient()
  const [chatEnabled, setChatEnabled] = useState(initialRace?.chat_enabled ?? true)
  const [isToggling, setIsToggling] = useState(false)
  const [metrics, setMetrics] = useState(initialMetrics)

  // Refresh metrics periodically
  useEffect(() => {
    if (!initialRace?.id) return

    async function refreshMetrics() {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      // Get message count for this race weekend
      const { count: totalMessages } = await supabase
        .from('live_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', initialRace.id)
        .is('deleted_at', null)

      // Get unique users who sent messages
      const { data: messages } = await supabase
        .from('live_chat_messages')
        .select('user_id')
        .eq('track_id', initialRace.id)
        .is('deleted_at', null)

      const uniqueUsers = new Set(messages?.map((m) => m.user_id) || []).size

      // Get messages in last hour for per-minute calculation
      const { count: recentMessages } = await supabase
        .from('live_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', initialRace.id)
        .is('deleted_at', null)
        .gte('created_at', oneHourAgo.toISOString())

      const messagesPerMinute = recentMessages ? Math.round(recentMessages / 60) : 0

      setMetrics({
        totalMessages: totalMessages || 0,
        activeUsers: uniqueUsers,
        messagesPerMinute,
      })
    }

    refreshMetrics()
    const interval = setInterval(refreshMetrics, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [initialRace?.id, supabase])

  async function handleToggleChat() {
    setIsToggling(true)
    try {
      const response = await fetch('/api/admin/chat/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: initialRace.id,
          enabled: !chatEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle chat')
      }

      const data = await response.json()
      setChatEnabled(data.enabled)
    } catch (error) {
      console.error('Error toggling chat:', error)
      alert('Failed to toggle chat')
    } finally {
      setIsToggling(false)
    }
  }

  if (!initialRace) {
    return null
  }

  const startDate = initialRace.start_date
    ? new Date(initialRace.start_date)
    : null
  const endDate = initialRace.end_date
    ? new Date(new Date(initialRace.end_date).getTime() + 24 * 60 * 60 * 1000)
    : null

  const now = new Date()
  const isWithinWindow =
    Boolean(startDate && endDate && now >= startDate && now <= endDate)
  const isActive = isWithinWindow && chatEnabled

  const isUpcoming = startDate && now < startDate

  if (!isActive && !isUpcoming) {
    return null // Don't show widget if race weekend is not active or upcoming
  }

  return (
    <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Race Weekend</h2>
        </div>
        <Link
          href={`/tracks/${initialRace.name?.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View Race Page →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Race Info */}
        <div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {initialRace.name || 'Unknown Race'}
          </h3>
          {initialRace.location && (
            <p className="text-sm text-gray-600">{initialRace.location}</p>
          )}

          <div className="mt-4 space-y-2">
            {startDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Starts: {startDate.toLocaleString()}
                </span>
              </div>
            )}
            {endDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Ends: {endDate.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Metrics & Controls */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
            {isWithinWindow ? (
              <button
                onClick={handleToggleChat}
                disabled={isToggling}
                className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  chatEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {chatEnabled ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    <span>{isToggling ? 'Disabling...' : 'Disable'}</span>
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    <span>{isToggling ? 'Enabling...' : 'Enable'}</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {isActive && metrics && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Total Messages</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {metrics.totalMessages.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Active Users</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {metrics.activeUsers}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Messages/Min</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {metrics.messagesPerMinute}
                </span>
              </div>
            </div>
          )}

          {!isActive && (
            <p className="text-sm text-gray-500">
              {isUpcoming
                ? 'Chat will be available when the race weekend starts'
                : 'Chat is currently inactive'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
