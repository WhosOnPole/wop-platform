'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const trackSchema = z.object({
  image_url: z.string().url().optional().or(z.literal('')),
  built_date: z.string().optional().or(z.literal('')),
  track_length: z.number().positive().optional().or(z.null()),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
  history_text: z.string().max(10000).optional().or(z.literal('')),
})

interface TrackEditModalProps {
  track: {
    id: string
    name: string
    image_url: string | null
    built_date: string | null
    track_length: number | null
    overview_text: string | null
    history_text: string | null
  }
  onClose: () => void
}

export function TrackEditModal({ track, onClose }: TrackEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    image_url: track.image_url || '',
    built_date: track.built_date || '',
    track_length: track.track_length?.toString() || '',
    overview_text: track.overview_text || '',
    history_text: track.history_text || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = trackSchema.parse({
        image_url: formData.image_url || undefined,
        built_date: formData.built_date || undefined,
        track_length: formData.track_length ? parseFloat(formData.track_length) : null,
        overview_text: formData.overview_text || undefined,
        history_text: formData.history_text || undefined,
      })

      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          ...validated,
          image_url: validated.image_url || null,
          built_date: validated.built_date || null,
          overview_text: validated.overview_text || null,
          history_text: validated.history_text || null,
        })
        .eq('id', track.id)

      if (updateError) throw updateError

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update track')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Track: {track.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Built Date</label>
              <input
                type="date"
                value={formData.built_date}
                onChange={(e) => setFormData({ ...formData, built_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Track Length (km)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.track_length}
                onChange={(e) => setFormData({ ...formData, track_length: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Overview Text</label>
            <textarea
              value={formData.overview_text}
              onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">History Text</label>
            <textarea
              value={formData.history_text}
              onChange={(e) => setFormData({ ...formData, history_text: e.target.value })}
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

