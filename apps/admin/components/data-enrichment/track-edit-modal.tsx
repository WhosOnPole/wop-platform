'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { localToUtc, utcToLocalDatetimeString } from '@/utils/date-utils'

const TRACK_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Monaco', label: 'Monaco' },
  { value: 'Europe/Budapest', label: 'Budapest' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'UTC', label: 'UTC' },
]

const trackSchema = z.object({
  name: z.string().min(1).max(200),
  laps: z.number().int().min(1).optional().or(z.null()),
  location: z.string().max(200).optional().or(z.literal('')),
  country: z.string().max(200).optional().or(z.literal('')),
  circuit_ref: z.string().max(200).optional().or(z.literal('')),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
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
    timezone: string | null
    circuit_ref: string | null
    overview_text: string | null
    website_url: string | null
  }
  onClose: () => void
}

function splitDatetime(datetime: string): { date: string; time: string } {
  if (!datetime) return { date: '', time: '' }
  if (datetime.includes('T')) {
    const [date, time] = datetime.split('T')
    return { date: date || '', time: (time || '').slice(0, 5) || '00:00' }
  }
  return { date: datetime.slice(0, 10) || '', time: '00:00' }
}

export function TrackEditModal({ track, onClose }: TrackEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tz = track.timezone || 'UTC'
  const startLocal = track.start_date ? utcToLocalDatetimeString(track.start_date, tz) : ''
  const endLocal = track.end_date ? utcToLocalDatetimeString(track.end_date, tz) : ''
  const [formData, setFormData] = useState({
    name: track.name || '',
    laps: track.laps?.toString() || '',
    location: track.location || '',
    country: track.country || '',
    circuit_ref: track.circuit_ref || '',
    overview_text: track.overview_text || '',
    website_url: track.website_url || '',
    timezone: track.timezone || 'UTC',
    start_date: splitDatetime(startLocal).date,
    start_time: splitDatetime(startLocal).time,
    end_date: splitDatetime(endLocal).date,
    end_time: splitDatetime(endLocal).time,
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
        circuit_ref: formData.circuit_ref || undefined,
        overview_text: formData.overview_text || undefined,
        website_url: formData.website_url || undefined,
      })

      const tz = formData.timezone || 'UTC'
      const startLocal = formData.start_date
        ? `${formData.start_date}T${formData.start_time || '00:00'}`
        : ''
      const endLocal = formData.end_date
        ? `${formData.end_date}T${formData.end_time || '00:00'}`
        : ''
      const startDateUtc = startLocal ? localToUtc(startLocal, tz) : null
      const endDateUtc = endLocal ? localToUtc(endLocal, tz) : null

      const updatePayload: Record<string, unknown> = {
        ...validated,
        laps: validated.laps ?? null,
        location: validated.location || null,
        country: validated.country || null,
        circuit_ref: validated.circuit_ref || null,
        overview_text: validated.overview_text || null,
        website_url: validated.website_url || null,
        timezone: formData.timezone || null,
        start_date: startDateUtc,
        end_date: endDateUtc,
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

          <div>
            <label className="block text-sm font-medium text-gray-700">Website URL</label>
            <p className="mt-0.5 text-xs text-gray-500">
              Shown under the overview section on the track page
            </p>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://..."
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
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Weekend date range</h3>
            <p className="text-xs text-gray-500 mb-3">
              Times are local to the track&apos;s timezone. Used for Pitlane upcoming and schedule tabs.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  {TRACK_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
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
