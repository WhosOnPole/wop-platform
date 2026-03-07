'use client'

import { useEffect, useState } from 'react'
import { formatWeekendRange, formatTimezoneVsEst } from '@/utils/date-utils'

export interface TrackScheduleEvent {
  event_type: string
  scheduled_at: string
  duration_minutes: number | null
}

interface TrackScheduleTabProps {
  events: TrackScheduleEvent[]
  track?: {
    start_date?: string | null
    end_date?: string | null
    name?: string | null
    location?: string | null
    country?: string | null
    circuit_ref?: string | null
    timezone?: string | null
  } | null
}

function formatEventDateAndTime(iso: string, timezone?: string | null): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''

  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    timeZone: timezone || 'UTC',
  }).format(d)

  const hourMinute = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone || 'UTC',
  }).format(d)

  const [hourRaw, minuteRaw] = hourMinute.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)

  if (hour === 0 && minute === 0) return `${datePart} - Midnight`
  if (hour === 12 && minute === 0) return `${datePart} - Noon`

  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const ampm = hour >= 12 ? 'pm' : 'am'
  return `${datePart} - ${hour12}:${String(minute).padStart(2, '0')}${ampm}`
}

function getTimezoneShortLabel(iso: string, timezone: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return timezone

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  }).formatToParts(d)
  const tzName = parts.find((part) => part.type === 'timeZoneName')?.value
  return tzName || timezone
}

function eventTypeLabel(eventType: string): string {
  switch (eventType) {
    case 'qualifying':
      return 'Qualifying'
    case 'race':
      return 'Race'
    case 'sprint_qualifying':
      return 'Sprint Qualifying'
    case 'sprint_race':
      return 'Sprint Race'
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

export function TrackScheduleTab({ events, track }: TrackScheduleTabProps) {
  const [userTimezone, setUserTimezone] = useState<string | null>(null)

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setUserTimezone(tz || null)
  }, [])

  const weekendRange = track
    ? formatWeekendRange(track.start_date ?? null, track.end_date ?? null, { year: false })
    : null

  if (events.length === 0 && !weekendRange) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center">
        <p className="text-white/60">No schedule events for this track yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/20 bg-white/5 p-6">
        {weekendRange && (
          <p className="mb-4 flex justify-between items-baseline gap-6 text-sm font-medium text-white">
            <span className="shrink-0">Weekend:</span>
            <span className="text-right">{weekendRange}</span>
          </p>
        )}
        {events.length === 0 ? (
          <p className="text-white/60 text-sm">No sessions scheduled yet.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((ev, i) => {
              const label = eventTypeLabel(ev.event_type)
              const localTime = formatEventDateAndTime(ev.scheduled_at, track?.timezone || undefined)
              const userTime =
                userTimezone && userTimezone !== track?.timezone
                  ? formatEventDateAndTime(ev.scheduled_at, userTimezone)
                  : null
              const userTzLabel = userTimezone
                ? getTimezoneShortLabel(ev.scheduled_at, userTimezone)
                : null
              return (
                <li
                  key={i}
                  className="flex justify-between items-baseline gap-6 text-sm text-white/90"
                >
                  <span className="shrink-0 font-medium text-white">{label}:</span>
                  <span className="text-right">
                    <span className="block">{localTime}</span>
                    {userTime && userTzLabel ? (
                      <span className="mt-1 block text-white/70">
                        {userTime} ({userTzLabel})
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {track?.timezone && (
        <p className="text-center text-sm text-white/60">
          {track.circuit_ref || track.name} is {formatTimezoneVsEst(track.timezone)}.
        </p>
      )}
    </div>
  )
}
