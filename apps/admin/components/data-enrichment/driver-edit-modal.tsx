'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

/** Nationalities that have flag assets (matches web app flags.ts getNationalityFlagPath). */
const DRIVER_NATIONALITIES = [
  '',
  'American',
  'Argentine',
  'Australian',
  'Austrian',
  'Azerbaijani',
  'Bahraini',
  'Belgian',
  'Brazilian',
  'British',
  'Canadian',
  'Chinese',
  'Dutch',
  'Emirati',
  'French',
  'German',
  'Hungarian',
  'Italian',
  'Japanese',
  'Mexican',
  'Monégasque',
  'Qatari',
  'Saudi',
  'Singaporean',
  'Spanish',
  'Thai',
] as const

const driverSchema = z.object({
  name: z.string().min(1).max(200),
  team_id: z.union([z.string().uuid(), z.literal(''), z.null()]).transform((val) => val === '' ? null : val),
  active: z.boolean().optional(),
  racing_number: z.number().int().positive().optional().or(z.null()),
  age: z.number().int().positive().max(100).optional().or(z.null()),
  nationality: z.string().max(100).optional().or(z.literal('')),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
  instagram_username: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ?? '').trim().toLowerCase() || undefined)
    .refine((val) => !val || (val.length <= 30 && /^[a-z0-9._]+$/.test(val)), 'Invalid Instagram username'),
})

interface Team {
  id: string
  name: string
  image_url: string | null
}

interface DriverEditModalProps {
  driver: {
    id: string
    name: string
    headshot_url: string | null
    image_url: string | null
    team_id: string | null
    active: boolean
    racing_number: number | null
    age: number | null
    nationality: string | null
    overview_text: string | null
    podiums_total: number
    current_standing: number | null
    world_championships: number
    instagram_username: string | null
  }
  onClose: () => void
}

export function DriverEditModal({ driver, onClose }: DriverEditModalProps) {
  const supabase = createClientComponentClient()
  const portraitUrl = driver.headshot_url || driver.image_url
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [formData, setFormData] = useState(() => {
    const d = driver.nationality?.trim() || ''
    const nationality =
      !d ? '' : (DRIVER_NATIONALITIES.find((n) => n && n.toLowerCase() === d.toLowerCase()) as string) || d
    return {
      name: driver.name || '',
      team_id: driver.team_id || '',
      active: driver.active ?? true,
      racing_number: driver.racing_number?.toString() || '',
      age: driver.age?.toString() || '',
      nationality,
      overview_text: driver.overview_text || '',
      instagram_username: driver.instagram_username || '',
    }
  })

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    setLoadingTeams(true)
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, image_url')
        .order('name')

      if (error) {
        console.error('Error loading teams:', error)
      } else {
        setTeams(data || [])
      }
    } finally {
      setLoadingTeams(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form data
      const validated = driverSchema.parse({
        name: formData.name.trim(),
        team_id: formData.team_id && formData.team_id.trim() !== '' ? formData.team_id : null,
        active: formData.active,
        racing_number: formData.racing_number ? parseInt(formData.racing_number) : null,
        age: formData.age ? parseInt(formData.age) : null,
        nationality: formData.nationality || undefined,
        overview_text: formData.overview_text || undefined,
        instagram_username: formData.instagram_username || undefined,
      })

      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          name: validated.name,
          team_id: validated.team_id || null,
          active: validated.active ?? true,
          team_icon_url: null,
          overview_text: validated.overview_text || null,
          racing_number: validated.racing_number ?? null,
          age: validated.age ?? null,
          nationality: validated.nationality || null,
          instagram_username: validated.instagram_username || null,
        })
        .eq('id', driver.id)

      if (updateError) throw updateError

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update driver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-drawer-overlay">
      <div className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Driver</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">ID: {driver.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close driver editor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="admin-drawer-body space-y-6">
            <div className="admin-asset-preview">
              {portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt={driver.name}
                  className="max-h-64 w-full object-contain object-top"
                />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-teal-600">
                    {driver.name.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-slate-500">No portrait available</p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                {error}
              </div>
            )}

            <div className="admin-form-section">
              <div className="grid grid-cols-2 gap-4">
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
              <label className="admin-form-label">
                Team
              </label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="admin-form-input"
                disabled={loadingTeams}
              >
                <option value="">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {loadingTeams && (
                <p className="mt-1 text-xs text-slate-500">Loading teams...</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="admin-checkbox"
                />
                <span className="text-sm font-medium text-slate-700">
                  Active (driver is active for current season)
                </span>
              </label>
            </div>

            <div>
              <label className="admin-form-label">
                Racing Number
              </label>
              <input
                type="number"
                value={formData.racing_number}
                onChange={(e) => setFormData({ ...formData, racing_number: e.target.value })}
                className="admin-form-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="admin-form-label">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="admin-form-input font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="admin-form-label">
                Nationality
              </label>
              <select
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="admin-form-input"
              >
                <option value="">—</option>
                {DRIVER_NATIONALITIES.filter(Boolean).map((nat) => (
                  <option key={nat} value={nat}>
                    {nat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="admin-form-label">
                Instagram Username
              </label>
              <input
                type="text"
                value={formData.instagram_username}
                onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })}
                placeholder="lewishamilton"
                className="admin-form-input"
              />
            </div>

            <div className="col-span-2">
              <label className="admin-form-label">
                Overview (driver page section)
              </label>
              <textarea
                rows={4}
                value={formData.overview_text}
                onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
                className="admin-form-input"
                placeholder="Short overview or bio shown on the driver entity page"
              />
              <p className="mt-1 text-xs text-slate-500">Max 5000 characters. Shown next to racing number on the driver page.</p>
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

