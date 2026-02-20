'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const trackSchema = z.object({
  name: z.string().min(1).max(200),
  laps: z.number().int().min(1).optional().or(z.null()),
  location: z.string().max(200).optional().or(z.literal('')),
  country: z.string().max(200).optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  circuit_ref: z.string().max(200).optional().or(z.literal('')),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
})

interface TrackEditModalProps {
  track: {
    id: string
    name: string
    laps: number | null
    location: string | null
    country: string | null
    start_date: string | null
    end_date: string | null
    circuit_ref: string | null
    overview_text: string | null
  }
  onClose: () => void
  /** When true, start_date is derived from schedule (first event) and shown read-only. */
  hasScheduleEvents?: boolean
}

export function TrackEditModal({ track, onClose, hasScheduleEvents = false }: TrackEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: track.name || '',
    laps: track.laps?.toString() || '',
    location: track.location || '',
    country: track.country || '',
    start_date: toDatetimeLocal(track.start_date),
    end_date: toDateInput(track.end_date),
    circuit_ref: track.circuit_ref || '',
    overview_text: track.overview_text || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = trackSchema.parse({
        name: formData.name.trim(),
        laps: formData.laps ? parseInt(formData.laps, 10) : null,
        location: formData.location || undefined,
        country: formData.country || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        circuit_ref: formData.circuit_ref || undefined,
        overview_text: formData.overview_text || undefined,
      })

      const updatePayload: Record<string, unknown> = {
        name: validated.name,
        laps: validated.laps ?? null,
        location: validated.location || null,
        country: validated.country || null,
        end_date: validated.end_date || null,
        circuit_ref: validated.circuit_ref || null,
        overview_text: validated.overview_text || null,
      }
      if (!hasScheduleEvents) {
        updatePayload.start_date = validated.start_date || null
      }

      const { error: updateError } = await supabase
        .from('tracks')
        .update(updatePayload)
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
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
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
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Overview text</label>
            <textarea
              value={formData.overview_text}
              onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Laps</label>
              <input
                type="number"
                min={1}
                step={1}
                value={formData.laps}
                onChange={(e) => setFormData({ ...formData, laps: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nickname</label>
              <input
                type="text"
                value={formData.circuit_ref}
                onChange={(e) => setFormData({ ...formData, circuit_ref: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="e.g. Melbourne"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weekend start date/time
                </label>
                {hasScheduleEvents && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    Start date is set from schedule (first event). Edit events in Schedule to change it.
                  </p>
                )}
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  readOnly={hasScheduleEvents}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
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

function toDateInput(value: string | null) {
  if (!value) return ''
  if (value.includes('T')) return value.slice(0, 10)
  return value
}

function toDatetimeLocal(value: string | null) {
  if (!value) return ''
  if (value.includes('T')) return value.slice(0, 16)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 16)
}
