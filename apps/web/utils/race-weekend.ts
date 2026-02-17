/**
 * Race weekend detection and chat status utilities
 */

import { parseDateOnly } from './date-utils'

interface Track {
  id: string
  name?: string
  start_date?: string | null
  end_date?: string | null
  chat_enabled?: boolean
}

export interface ChatStatus {
  mode: 'open' | 'read_only' | 'closed'
  opens_at?: string | null
  closes_at?: string | null
  slow_mode_ms?: number
  reason?: string
  error?: string
}

/**
 * Check if chat is enabled for a track
 */
export function isChatEnabled(track: Track): boolean {
  return track.chat_enabled !== false
}

/**
 * Get race weekend window (start and end times)
 * Uses parseDateOnly for date-only end_date to avoid timezone shift.
 */
export function getRaceWeekendWindow(track: Track): {
  start: Date | null
  end: Date | null
} {
  if (!track.start_date || !track.end_date) {
    return { start: null, end: null }
  }

  const start = new Date(track.start_date)
  const endDay =
    track.end_date.length <= 10 ? parseDateOnly(track.end_date) : new Date(track.end_date)
  if (!endDay) return { start: null, end: null }
  const end = new Date(endDay.getTime() + 24 * 60 * 60 * 1000) // +24 hours

  return { start, end }
}

/**
 * Check if race weekend is currently active
 */
export function isRaceWeekendActive(track: Track): boolean {
  // Chat must be enabled
  if (!isChatEnabled(track)) {
    return false
  }

  const { start, end } = getRaceWeekendWindow(track)
  
  if (!start || !end) {
    return false
  }

  const now = new Date()
  return now >= start && now <= end
}

/**
 * Get chat status from server (calls RPC)
 */
export async function getChatStatus(
  trackId: string,
  supabase: any
): Promise<ChatStatus> {
  try {
    const { data, error } = await supabase.rpc('get_chat_status', {
      p_track_id: trackId,
    })

    if (error) {
      console.error('Error getting chat status:', error)
      return {
        mode: 'closed',
        error: error.message,
      }
    }

    return data as ChatStatus
  } catch (error: any) {
    console.error('Error getting chat status:', error)
    return {
      mode: 'closed',
      error: error.message || 'Unknown error',
    }
  }
}

/**
 * Format time until race weekend starts/ends
 */
export function formatTimeUntil(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diff = date.getTime() - now.getTime()

  if (diff < 0) return ''

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
