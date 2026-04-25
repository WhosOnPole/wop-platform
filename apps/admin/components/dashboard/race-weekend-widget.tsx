'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar, MessageSquare, Users, Power, PowerOff, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { parseDateOnly } from '@/utils/date-utils'

interface RaceWeekendWidgetProps {
  initialRace: any
  initialRaceStatus: 'live' | 'upcoming'
  initialMetrics: {
    totalMessages: number
    activeUsers: number
    messagesPerMinute: number
  } | null
}

/** First and last event times (UTC) for the weekend; used to show start/end in user's local time. */
interface WeekendTimes {
  firstEventAt: string | null
  lastEventEndAt: string | null
}

export function RaceWeekendWidget({
  initialRace,
  initialRaceStatus,
  initialMetrics,
}: RaceWeekendWidgetProps) {
  const supabase = createClientComponentClient()
  const [chatEnabled, setChatEnabled] = useState(initialRace?.chat_enabled ?? true)
  const [isToggling, setIsToggling] = useState(false)
  const [metrics, setMetrics] = useState(initialMetrics)
  const [weekendTimes, setWeekendTimes] = useState<WeekendTimes>({
    firstEventAt: null,
    lastEventEndAt: null,
  })

  // Fetch first and last track_event for this track (for start/end times in user's locale)
  useEffect(() => {
    if (!initialRace?.id) return

    const seasonYear = new Date().getFullYear()

    async function loadWeekendTimes() {
      const { data: events } = await supabase
        .from('track_events')
        .select('scheduled_at, duration_minutes')
        .eq('track_id', initialRace.id)
        .eq('season_year', seasonYear)
        .order('scheduled_at', { ascending: true })

      if (!events?.length) {
        setWeekendTimes({ firstEventAt: null, lastEventEndAt: null })
        return
      }

      const first = events[0]
      const last = events[events.length - 1]
      const firstEventAt = first.scheduled_at ?? null
      const lastEventEndAt = last.scheduled_at && last.duration_minutes != null
        ? new Date(new Date(last.scheduled_at).getTime() + last.duration_minutes * 60 * 1000).toISOString()
        : last.scheduled_at ?? null

      setWeekendTimes({ firstEventAt, lastEventEndAt })
    }

    loadWeekendTimes()
  }, [initialRace?.id, supabase])

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
      toast.error('Failed to toggle chat')
    } finally {
      setIsToggling(false)
    }
  }

  if (!initialRace) {
    return null
  }

  // Date-only values from DB: parse at noon UTC so the calendar day doesn't shift in any timezone
  const startDateForDisplay = initialRace.start_date
    ? parseDateOnly(initialRace.start_date)
    : null
  const endDateForDisplay = initialRace.end_date
    ? parseDateOnly(initialRace.end_date)
    : null
  // Window boundaries (UTC) for "is within weekend" check
  const windowStart = initialRace.start_date
    ? new Date(initialRace.start_date + 'T00:00:00Z')
    : null
  const windowEnd = initialRace.end_date
    ? new Date(initialRace.end_date + 'T23:59:59.999Z')
    : null

  const now = new Date()
  const isWithinWindow =
    Boolean(windowStart && windowEnd && now >= windowStart && now <= windowEnd)

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone

  /** Format a date for the user's locale (date only). */
  function formatDateInUserLocale(date: Date | null): string {
    if (!date || isNaN(date.getTime())) return ''
    return date.toLocaleDateString(undefined, {
      dateStyle: 'long',
      timeZone: userTz,
    })
  }

  /** Format a date+time for the user's locale (e.g. "March 6, 2026 at 2:00 PM"). */
  function formatDateTimeInUserLocale(isoString: string | null): string {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: userTz,
    })
  }

  const isLive = initialRaceStatus === 'live'
  const isUpcoming = initialRaceStatus === 'upcoming'
  const isChatLive = isLive && chatEnabled

  if (!isLive && !isUpcoming) {
    return null
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#25B4B1]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Race weekend
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">
              {isLive ? 'Live Race' : 'Upcoming Race Weekend'}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isLive ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isLive ? 'Active' : 'Pending'}
          </span>
          <Link
            href={`https://www.whosonpole.org/tracks/${initialRace.name?.toLowerCase().replace(/\s+/g, '-')}`}
            className="text-sm font-bold text-[#25B4B1] transition hover:text-teal-700"
          >
            View Race Page →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        {/* Race Info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
          <h3 className="text-lg font-bold text-gray-900">
            {initialRace.name || 'Unknown Race'}
          </h3>
          {initialRace.location && (
            <p className="mt-1 text-sm text-gray-600">{initialRace.location}</p>
          )}

          <div className="mt-5 space-y-3">
            {(weekendTimes.firstEventAt || startDateForDisplay) && (
              <div className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                <span className="leading-5">
                  Starts: {weekendTimes.firstEventAt
                    ? formatDateTimeInUserLocale(weekendTimes.firstEventAt)
                    : formatDateInUserLocale(startDateForDisplay)}
                </span>
              </div>
            )}
            {(weekendTimes.lastEventEndAt || endDateForDisplay) && (
              <div className="flex items-start gap-3 rounded-lg bg-white p-3 text-sm text-gray-600">
                <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                <span className="leading-5">
                  Ends: {weekendTimes.lastEventEndAt
                    ? formatDateTimeInUserLocale(weekendTimes.lastEventEndAt)
                    : formatDateInUserLocale(endDateForDisplay)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Metrics & Controls */}
        <div className="rounded-xl border border-gray-100 bg-white">
          <div className="mb-4 flex items-center justify-between">
            <div className="px-5 pt-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                Moderation channel
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Live Chat</h3>
            </div>
            {isWithinWindow ? (
              <button
                onClick={handleToggleChat}
                disabled={isToggling}
                className={`mr-5 mt-5 flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                  chatEnabled
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#25B4B1] text-white hover:bg-teal-600'
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

          {isChatLive && metrics && (
            <div className="space-y-3 px-5 pb-5">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-[#25B4B1]" />
                  <span className="text-sm font-medium text-gray-600">Total Messages</span>
                </div>
                <span className="font-mono text-lg font-bold tabular-nums text-gray-900">
                  {metrics.totalMessages.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-[#25B4B1]" />
                  <span className="text-sm font-medium text-gray-600">Active Users</span>
                </div>
                <span className="font-mono text-lg font-bold tabular-nums text-gray-900">
                  {metrics.activeUsers}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 transition hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-[#25B4B1]" />
                  <span className="text-sm font-medium text-gray-600">Messages/Min</span>
                </div>
                <span className="font-mono text-lg font-bold tabular-nums text-gray-900">
                  {metrics.messagesPerMinute}
                </span>
              </div>
            </div>
          )}

          {!isChatLive && (
            <p className="px-5 pb-5 text-sm text-gray-500">
              {isLive && !chatEnabled
                ? 'Race is live, but chat is currently disabled'
                : isUpcoming
                ? 'Chat will be available when the race weekend starts'
                : 'Chat is currently inactive'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
