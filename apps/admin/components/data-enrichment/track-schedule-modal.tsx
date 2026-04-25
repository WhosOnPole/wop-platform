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
    start_date?: string | null
    end_date?: string | null
  }
  timezone?: string | null
  onClose: () => void
  onSaved?: () => void
}

export function TrackScheduleModal({ track, timezone, onClose, onSaved }: TrackScheduleModalProps) {
  const tz = timezone || 'UTC'
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

  useEffect(() => {
    loadEvents()
  }, [track.id, seasonYear])

  async function preserveWeekendDates() {
    // Keep weekend dates authoritative on tracks and decoupled from event edits.
    if (track.start_date == null && track.end_date == null) return

    const { error: trackUpdateError } = await supabase
      .from('tracks')
      .update({
        start_date: track.start_date ?? null,
        end_date: track.end_date ?? null,
      })
      .eq('id', track.id)

    if (trackUpdateError) {
      throw trackUpdateError
    }
  }

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
      scheduled_at: utcToLocalDatetimeString(event.scheduled_at, tz),
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
      const scheduledAtUtc = localToUtc(formData.scheduled_at, tz)
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
      await preserveWeekendDates()
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
      try {
        await preserveWeekendDates()
      } catch (err: any) {
        setError(err.message ?? 'Failed to preserve weekend dates')
      }
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
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="admin-drawer-overlay">
      <div className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Schedule: {track.name}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Times in track local time{tz !== 'UTC' ? ` (${tz})` : ' (UTC)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-3">
          <label className="admin-form-label">Season</label>
          <select
            value={seasonYear}
            onChange={(e) => setSeasonYear(parseInt(e.target.value, 10))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mx-6 mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="admin-form-label">Event type</label>
                <select
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as typeof formData.event_type })
                  }
                  className="admin-form-input"
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
                <label className="admin-form-label">Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="admin-form-input font-mono tabular-nums"
                  placeholder="60"
                  min={1}
                />
              </div>
            </div>
            <div>
                <label className="admin-form-label">
                Date & time (track local)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="admin-form-input"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="admin-button-secondary px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="admin-button-primary px-3 py-1.5"
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
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 rounded-full bg-teal-50 p-3 text-teal-600">
                <Plus className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-900">No events for {seasonYear}</p>
              <p className="mt-1 text-sm text-slate-500">Add qualifying and race sessions.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Scheduled</th>
                  <th>Duration</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>{formatEventType(ev.event_type)}</td>
                    <td>{formatScheduledAt(ev.scheduled_at)}</td>
                    <td className="font-mono tabular-nums">{ev.duration_minutes ?? '—'} min</td>
                    <td>
                      <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(ev)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      </div>
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
