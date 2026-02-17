import { formatWeekendRange } from '@/utils/date-utils'

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
  } | null
}

function formatEventDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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
  const weekendRange = track
    ? formatWeekendRange(track.start_date ?? null, track.end_date ?? null)
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
          <p className="mb-4 text-sm font-medium text-white">
            Weekend: {weekendRange} 
          </p>
        )}
        {events.length === 0 ? (
          <p className="text-white/60 text-sm">No sessions scheduled yet.</p>
        ) : (
          <ul className="space-y-4">
            {events.map((ev, i) => {
              const label = eventTypeLabel(ev.event_type)
              const dateTime = formatEventDateTime(ev.scheduled_at)
              const withDuration =
                ev.event_type === 'qualifying' || ev.event_type === 'sprint_qualifying'
              const durationPart =
                withDuration && ev.duration_minutes != null
                  ? ` • ${ev.duration_minutes} min`
                  : ''
              return (
                <li
                  key={i}
                  className="flex justify-between items-baseline gap-6 text-sm text-white/90"
                >
                  <span className="shrink-0 font-medium text-white">{label}:</span>
                  <span className="text-right">
                    {dateTime}
                    {durationPart}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
