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
                  Weekend ({CURRENT_SEASON})
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Timezone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {track.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {formatWeekendRange(track.start_date, track.end_date) ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {track.timezone ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <button
                      onClick={() => setScheduleTrack(track)}
                      className="flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <Calendar className="mr-1 h-4 w-4" />
                      Manage Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tracks.length === 0 && (
          <p className="px-6 py-8 text-sm text-gray-500">
            No tracks with schedule dates. Add start date and race day in the Tracks tab.
          </p>
        )}
      </div>

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
