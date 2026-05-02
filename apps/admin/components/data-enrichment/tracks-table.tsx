'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2 } from 'lucide-react'
import { TrackEditModal } from './track-edit-modal'
import { formatWeekendRange } from '@/utils/date-utils'

interface Track {
  id: string
  name: string
  laps: number | null
  turns: number | null
  location: string | null
  country: string | null
  start_date: string | null
  end_date: string | null
  timezone: string | null
  circuit_ref: string | null
  overview_text: string | null
  history_text: string | null
  website_url: string | null
}

const CURRENT_SEASON = 2026

export function TracksTable() {
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [eventCountByTrackId, setEventCountByTrackId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadTracks()
  }, [])

  async function loadTracks() {
    setLoading(true)
    const { data, error } = await supabase.from('tracks').select('*').order('name')
    if (error) {
      console.error('Error loading tracks:', error)
      setTracks([])
    } else {
      setTracks(data ?? [])
      if ((data?.length ?? 0) > 0) {
        const ids = data!.map((t) => t.id)
        const { data: events } = await supabase
          .from('track_events')
          .select('track_id')
          .in('track_id', ids)
          .eq('season_year', CURRENT_SEASON)
        const count: Record<string, number> = {}
        ids.forEach((id) => (count[id] = 0))
        events?.forEach((e) => (count[e.track_id] = (count[e.track_id] ?? 0) + 1))
        setEventCountByTrackId(count)
      }
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <>
      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Track</th>
                <th>Weekend</th>
                <th>Events</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td>
                    <div className="text-sm font-bold text-slate-900">{track.name}</div>
                    {track.country && <div className="text-xs text-slate-500">{track.country}</div>}
                  </td>
                  <td>
                    {formatWeekendRange(track.start_date, track.end_date) ?? '—'}
                  </td>
                  <td className="font-mono tabular-nums text-slate-900">
                    {eventCountByTrackId[track.id] ?? '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setEditingTrack(track)}
                      className="admin-action-link"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTrack && (
        <TrackEditModal
          track={editingTrack}
          onClose={() => {
            setEditingTrack(null)
            loadTracks()
          }}
        />
      )}
    </>
  )
}

