'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const teamSchema = z.object({
  name: z.string().min(1).max(200),
  image_url: z.string().url().optional().or(z.literal('')),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
  instagram_username: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => (val ?? '').trim().toLowerCase() || undefined)
    .refine((val) => !val || (val.length <= 30 && /^[a-z0-9._]+$/.test(val)), 'Invalid Instagram username'),
  active: z.boolean().optional(),
})

interface TeamEditModalProps {
  team: {
    id: string
    name: string
    image_url: string | null
    overview_text: string | null
    instagram_username: string | null
    active: boolean
  }
  onClose: () => void
}

export function TeamEditModal({ team, onClose }: TeamEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: team.name || '',
    image_url: team.image_url || '',
    overview_text: team.overview_text || '',
    instagram_username: team.instagram_username || '',
    active: team.active ?? true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = teamSchema.parse({
        name: formData.name.trim(),
        image_url: formData.image_url || undefined,
        overview_text: formData.overview_text || undefined,
        instagram_username: formData.instagram_username || undefined,
        active: formData.active,
      })

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          ...validated,
          name: validated.name,
          image_url: validated.image_url || null,
          overview_text: validated.overview_text || null,
          instagram_username: validated.instagram_username || null,
          active: validated.active ?? true,
        })
        .eq('id', team.id)

      if (updateError) throw updateError

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-drawer-overlay">
      <div className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Edit Team</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">ID: {team.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close team editor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="admin-drawer-body space-y-6">
            <div className="admin-asset-preview">
              {formData.image_url ? (
                <img src={formData.image_url} alt={team.name} className="max-h-56 w-full object-contain" />
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-bold text-teal-600">
                    {team.name.charAt(0)}
                  </div>
                  <p className="text-sm font-medium text-slate-500">No team image available</p>
                </div>
              )}
            </div>

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
            <label className="admin-form-label">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="admin-form-label">Overview Text</label>
            <textarea
              value={formData.overview_text}
              onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
              rows={6}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="admin-form-label">Instagram Username</label>
            <input
              type="text"
              value={formData.instagram_username}
              onChange={(e) => setFormData({ ...formData, instagram_username: e.target.value })}
              placeholder="mercedesamgf1"
              className="admin-form-input"
            />
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
                Active (team is active for current season)
              </span>
            </label>
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

