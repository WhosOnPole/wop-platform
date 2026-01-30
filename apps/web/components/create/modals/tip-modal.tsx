'use client'

import { useEffect, useState, FormEvent } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'

interface TipModalProps {
  onClose: () => void
}

interface TrackOption {
  id: string
  name: string
}

export function TipModal({ onClose }: TipModalProps) {
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<TrackOption[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)
  const [trackId, setTrackId] = useState('')
  const [tip, setTip] = useState('')
  const [link, setLink] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadTracks() {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('id, name')
          .order('name', { ascending: true })

        if (error) {
          console.error('Error loading tracks for tip modal:', error)
        }
        if (isMounted) {
          setTracks(data ?? [])
        }
      } finally {
        if (isMounted) setTracksLoading(false)
      }
    }
    loadTracks()
    return () => {
      isMounted = false
    }
  }, [supabase])

  function reset() {
    setTrackId('')
    setTip('')
    setLink('')
    setImage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    console.info('Submit tip (stub):', { trackId, tip, link, image })
    // TODO: send to admin dashboard as pending approval; top tip flag managed by admins
    reset()
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Submit a tip</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Track</label>
            <select
              required
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              disabled={tracksLoading}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="" disabled>
                {tracksLoading ? 'Loading tracks...' : 'Select a track'}
              </option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tip</label>
            <textarea
              required
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Share your track tip"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Supporting link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-gray-700"
            />
          </div>

          <p className="text-xs text-gray-500">
            Tip will go to admin dashboard for approval. Approved tips are added to the track tips
            section. Admins can mark/unmark top tips.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit tip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
