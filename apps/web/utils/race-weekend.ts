/**
 * Race weekend detection and chat status utilities
 */

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

/** Date-only YYYY-MM-DD from DB (tracks.start_date / end_date are DATE, no timezone). */
function toDateStr(s: string | null | undefined): string | null {
  if (!s) return null
  const part = s.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : null
}

/**
 * Get race weekend window (start and end of start_date..end_date in UTC).
 * Tracks store DATE only; we build UTC boundaries for comparisons.
 */
export function getRaceWeekendWindow(track: Track): {
  start: Date | null
  end: Date | null
} {
  const startStr = toDateStr(track.start_date)
  const endStr = toDateStr(track.end_date)
  if (!startStr || !endStr) return { start: null, end: null }

  const start = new Date(startStr + 'T00:00:00Z')
  const end = new Date(endStr + 'T23:59:59.999Z')
  return { start, end }
}

/**
 * Check if the track's race weekend window (start_date..end_date) is active.
 * Use for non-chat features only (e.g. check-in section on track page).
 * For live chat open/closed, use getChatStatus(trackId) which is driven by track_events.
 */
export function isRaceWeekendActive(track: Track): boolean {
  if (!isChatEnabled(track)) return false

  const startStr = toDateStr(track.start_date)
  const endStr = toDateStr(track.end_date)
  if (!startStr || !endStr) return false

  const today = new Date().toISOString().slice(0, 10)
  return today >= startStr && today <= endStr
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
