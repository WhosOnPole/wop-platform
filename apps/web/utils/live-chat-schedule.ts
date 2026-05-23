import type { SupabaseClient } from '@supabase/supabase-js'

export interface ScheduledTrackEvent {
  id: string
  track_id: string
  event_type: string
  scheduled_at: string
  duration_minutes: number | null
  live_chat_enabled: boolean
}

export interface PitlaneTrackSummary {
  id: string
  name: string
  location: string | null
  country: string | null
  start_date: string | null
  end_date: string | null
  circuit_ref: string | null
}

export async function getNextLiveChatEvent(
  supabase: SupabaseClient
): Promise<ScheduledTrackEvent | null> {
  const { data, error } = await supabase
    .from('track_events')
    .select('id, track_id, event_type, scheduled_at, duration_minutes, live_chat_enabled')
    .eq('live_chat_enabled', true)
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching next live chat event:', error)
    return null
  }

  return data as ScheduledTrackEvent | null
}

export function formatLiveChatCountdown(target: Date): string {
  const now = new Date()
  const timeUntil = target.getTime() - now.getTime()
  if (timeUntil <= 0) return ''

  const daysUntil = Math.floor(timeUntil / (1000 * 60 * 60 * 24))
  const hoursUntil = Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  if (daysUntil > 0) {
    return `${daysUntil} day${daysUntil > 1 ? 's' : ''} until live chat is open`
  }

  if (hoursUntil > 0) {
    return `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} until live chat is open`
  }

  return 'Less than an hour until live chat is open'
}
