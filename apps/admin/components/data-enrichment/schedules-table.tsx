'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar, Loader2 } from 'lucide-react'
import { TrackScheduleModal } from './track-schedule-modal'
import { formatWeekendRange } from '@/utils/date-utils'

interface ScheduleTrack {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  timezone: string | null
}

const CURRENT_SEASON = 2026

export function SchedulesTable() {
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<ScheduleTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleTrack, setScheduleTrack] = useState<ScheduleTrack | null>(null)

  useEffect(() => {
    loadTracks()
  }, [])

  async function loadTracks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tracks')
      .select('id, name, start_date, end_date, timezone')
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true })
    if (error) {
      console.error('Error loading tracks:', error)
      setTracks([])
    } else {
      setTracks(data ?? [])
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
                <th>Weekend ({CURRENT_SEASON})</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td className="font-bold text-slate-900">
                    {track.name}
                  </td>
                  <td>
                    {formatWeekendRange(track.start_date, track.end_date) ?? '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => setScheduleTrack(track)}
                      className="admin-action-link"
                    >
                      <Calendar className="h-4 w-4" />
                      Manage Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tracks.length === 0 && (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-3 rounded-full bg-teal-50 p-3 text-teal-600">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="font-bold text-slate-900">No scheduled tracks</p>
            <p className="mt-1 text-sm text-slate-500">
              Add start date and race day in the Tracks tab.
            </p>
          </div>
        )}
      </div>

      {scheduleTrack && (
        <TrackScheduleModal
          track={{
            id: scheduleTrack.id,
            name: scheduleTrack.name,
            start_date: scheduleTrack.start_date,
            end_date: scheduleTrack.end_date,
          }}
          timezone={scheduleTrack.timezone}
          onClose={() => setScheduleTrack(null)}
          onSaved={loadTracks}
        />
      )}
    </>
  )
}
