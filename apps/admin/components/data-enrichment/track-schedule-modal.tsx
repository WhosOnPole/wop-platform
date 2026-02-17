'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { localToUtc, utcToLocalDatetimeString } from '@/utils/date-utils'

const EVENT_TYPES = [
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'race', label: 'Race' },
  { value: 'sprint_qualifying', label: 'Sprint Qualifying' },
  { value: 'sprint_race', label: 'Sprint Race' },
] as const

interface TrackEvent {
  id: string
  track_id: string
  event_type: string
  scheduled_at: string
  duration_minutes: number | null
  season_year: number
}

interface TrackScheduleModalProps {
  track: {
    id: string
    name: string
    timezone: string | null
  }
  onClose: () => void
  onSaved?: () => void
}

export function TrackScheduleModal({ track, onClose, onSaved }: TrackScheduleModalProps) {
  const supabase = createClientComponentClient()
  const [events, setEvents] = useState<TrackEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    event_type: 'qualifying' as const,
    scheduled_at: '',
    duration_minutes: '',
    season_year: new Date().getFullYear(),
  })

  const timezone = track.timezone || 'UTC'

  useEffect(() => {
    loadEvents()
  }, [track.id, seasonYear])

  async function loadEvents() {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('track_events')
      .select('id, track_id, event_type, scheduled_at, duration_minutes, season_year')
      .eq('track_id', track.id)
      .eq('season_year', seasonYear)
      .order('scheduled_at', { ascending: true })
    if (e) {
      setError(e.message)
      setEvents([])
    } else {
      setEvents(data ?? [])
    }
    setLoading(false)
  }

  function openAddForm() {
    setEditingId(null)
    setFormData({
      event_type: 'qualifying',
      scheduled_at: '',
      duration_minutes: '',
      season_year: seasonYear,
    })
    setShowForm(true)
  }

  function openEditForm(event: TrackEvent) {
    setEditingId(event.id)
    setFormData({
      event_type: event.event_type as (typeof formData)['event_type'],
      scheduled_at: utcToLocalDatetimeString(event.scheduled_at, timezone),
      duration_minutes: event.duration_minutes?.toString() ?? '',
      season_year: event.season_year,
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const scheduledAtUtc = localToUtc(formData.scheduled_at, timezone)
      if (!scheduledAtUtc) {
        setError('Invalid date/time')
        return
      }
      const payload = {
        track_id: track.id,
        event_type: formData.event_type,
        scheduled_at: scheduledAtUtc,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes, 10) : null,
        season_year: formData.season_year,
      }
      if (editingId) {
        const { error: updateErr } = await supabase
          .from('track_events')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from('track_events').insert(payload)
        if (insertErr) throw insertErr
      }
      setShowForm(false)
      loadEvents()
      onSaved?.()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return
    setError(null)
    const { error: e } = await supabase.from('track_events').delete().eq('id', id)
    if (e) setError(e.message)
    else {
      loadEvents()
      onSaved?.()
    }
  }

  function formatEventType(value: string) {
    return EVENT_TYPES.find((t) => t.value === value)?.label ?? value
  }

  function formatScheduledAt(utcIso: string) {
    const d = new Date(utcIso)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule: {track.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Times in local time ({timezone})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Season</label>
          <select
            value={seasonYear}
            onChange={(e) => setSeasonYear(parseInt(e.target.value, 10))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            {[2026, 2025, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mx-6 mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Event type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as typeof formData.event_type })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="60"
                  min={1}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date & time (local at track)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </span>
                ) : (
                  editingId ? 'Update' : 'Add'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-auto px-6 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">
              No events for {seasonYear}. Add qualifying and race sessions.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Scheduled (local)</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-gray-100">
                    <td className="py-2">{formatEventType(ev.event_type)}</td>
                    <td className="py-2">{formatScheduledAt(ev.scheduled_at)}</td>
                    <td className="py-2">{ev.duration_minutes ?? '—'} min</td>
                    <td className="py-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(ev)}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
