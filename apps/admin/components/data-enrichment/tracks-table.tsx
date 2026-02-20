'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2, Calendar } from 'lucide-react'
import { TrackEditModal } from './track-edit-modal'
import { TrackScheduleModal } from './track-schedule-modal'
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
}

const CURRENT_SEASON = 2026

export function TracksTable() {
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [eventCountByTrackId, setEventCountByTrackId] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)
  const [scheduleTrack, setScheduleTrack] = useState<Track | null>(null)

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Track
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Weekend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timezone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Events
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{track.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {formatWeekendRange(track.start_date, track.end_date) ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {track.timezone ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {eventCountByTrackId[track.id] ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium flex gap-2">
                    <button
                      onClick={() => setScheduleTrack(track)}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Schedule
                    </button>
                    <button
                      onClick={() => setEditingTrack(track)}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="mr-1 h-4 w-4" />
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
          hasScheduleEvents={(eventCountByTrackId[editingTrack.id] ?? 0) > 0}
        />
      )}

      {scheduleTrack && (
        <TrackScheduleModal
          track={{
            id: scheduleTrack.id,
            name: scheduleTrack.name,
            timezone: scheduleTrack.timezone,
          }}
          onClose={() => setScheduleTrack(null)}
          onSaved={loadTracks}
        />
      )}
    </>
  )
}

