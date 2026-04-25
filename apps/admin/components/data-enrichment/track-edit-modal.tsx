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
    <div className="admin-drawer-overlay">
      <div className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Track</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">ID: {track.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close track editor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="admin-drawer-body space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>
            )}

            <div className="admin-form-section">
          <div>
            <label className="admin-form-label">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="admin-form-input"
              required
            />
          </div>

          <div>
            <label className="admin-form-label">Overview text</label>
            <textarea
              value={formData.overview_text}
              onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
              rows={4}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="admin-form-label">Website URL</label>
            <p className="mt-0.5 text-xs text-slate-500">
              Shown under the overview section on the track page
            </p>
            <input
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://..."
              className="admin-form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-form-label">Laps</label>
              <input
                type="number"
                min={1}
                step={1}
                value={formData.laps}
                onChange={(e) => setFormData({ ...formData, laps: e.target.value })}
                className="admin-form-input font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="admin-form-label">Nickname</label>
              <input
                type="text"
                value={formData.circuit_ref}
                onChange={(e) => setFormData({ ...formData, circuit_ref: e.target.value })}
                className="admin-form-input"
                placeholder="e.g. Melbourne"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-form-label">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="admin-form-input"
              />
            </div>
            <div>
              <label className="admin-form-label">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="admin-form-input"
              />
            </div>
          </div>
            </div>

          <div className="admin-form-section">
            <h3 className="text-sm font-bold text-slate-900">Weekend date range</h3>
            <p className="text-xs text-slate-500">
              Times are local to the track&apos;s timezone. Used for Pitlane upcoming and schedule tabs.
            </p>
            <div className="space-y-4">
              <div>
                <label className="admin-form-label">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="admin-form-input"
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
                  <label className="admin-form-label">Start date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div>
                  <label className="admin-form-label">Start time</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-form-label">End date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div>
                  <label className="admin-form-label">End time</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="admin-drawer-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-button-secondary"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="admin-button-primary"
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
