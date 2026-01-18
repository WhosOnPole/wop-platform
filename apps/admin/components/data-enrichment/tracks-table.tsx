'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit, Loader2 } from 'lucide-react'
import { TrackEditModal } from './track-edit-modal'

interface Track {
  id: string
  name: string
  image_url: string | null
  built_date: string | null
  track_length: number | null
  turns: number | null
  location: string | null
  country: string | null
  start_date: string | null
  overview_text: string | null
  history_text: string | null
}

export function TracksTable() {
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTrack, setEditingTrack] = useState<Track | null>(null)

  useEffect(() => {
    loadTracks()
  }, [])

  async function loadTracks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading tracks:', error)
    } else {
      setTracks(data || [])
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      {track.image_url && (
                        <img
                          src={track.image_url}
                          alt={track.name}
                          className="mr-3 h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">{track.name}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
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
        />
      )}
    </>
  )
}

