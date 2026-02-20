'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const driverSchema = z.object({
  name: z.string().min(1).max(200),
  image_url: z.string().url().optional().or(z.literal('')),
  team_id: z.union([z.string().uuid(), z.literal(''), z.null()]).transform((val) => val === '' ? null : val),
  active: z.boolean().optional(),
  racing_number: z.number().int().positive().optional().or(z.null()),
  age: z.number().int().positive().max(100).optional().or(z.null()),
  nationality: z.string().max(100).optional().or(z.literal('')),
  overview_text: z.string().max(5000).optional().or(z.literal('')),
  podiums_total: z.number().int().min(0).optional(),
  current_standing: z.number().int().positive().optional().or(z.null()),
  world_championships: z.number().int().min(0).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
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
    instagram_url: string | null
  }
  onClose: () => void
}

export function DriverEditModal({ driver, onClose }: DriverEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [formData, setFormData] = useState({
    name: driver.name || '',
    image_url: driver.image_url || '',
    team_id: driver.team_id || '',
    active: driver.active ?? true,
    racing_number: driver.racing_number?.toString() || '',
    age: driver.age?.toString() || '',
    nationality: driver.nationality || '',
    overview_text: driver.overview_text || '',
    podiums_total: driver.podiums_total.toString(),
    current_standing: driver.current_standing?.toString() || '',
    world_championships: driver.world_championships.toString(),
    instagram_url: driver.instagram_url || '',
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
        image_url: formData.image_url || undefined,
        team_id: formData.team_id && formData.team_id.trim() !== '' ? formData.team_id : null,
        active: formData.active,
        racing_number: formData.racing_number ? parseInt(formData.racing_number) : null,
        age: formData.age ? parseInt(formData.age) : null,
        nationality: formData.nationality || undefined,
        overview_text: formData.overview_text || undefined,
        podiums_total: parseInt(formData.podiums_total),
        current_standing: formData.current_standing ? parseInt(formData.current_standing) : null,
        world_championships: parseInt(formData.world_championships),
        instagram_url: formData.instagram_url || undefined,
      })

      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          name: validated.name,
          image_url: validated.image_url || null,
          team_id: validated.team_id || null,
          active: validated.active ?? true,
          team_icon_url: null,
          overview_text: validated.overview_text || null,
          racing_number: validated.racing_number ?? null,
          age: validated.age ?? null,
          nationality: validated.nationality || null,
          podiums_total: validated.podiums_total ?? 0,
          current_standing: validated.current_standing ?? null,
          world_championships: validated.world_championships ?? 0,
          instagram_url: validated.instagram_url || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Driver: {driver.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium text-gray-700">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Team
              </label>
              <select
                value={formData.team_id}
                onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                <p className="mt-1 text-xs text-gray-500">Loading teams...</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (driver is active for current season)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Racing Number
              </label>
              <input
                type="number"
                value={formData.racing_number}
                onChange={(e) => setFormData({ ...formData, racing_number: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nationality
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Overview (driver page section)
              </label>
              <textarea
                rows={4}
                value={formData.overview_text}
                onChange={(e) => setFormData({ ...formData, overview_text: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Short overview or bio shown on the driver entity page"
              />
              <p className="mt-1 text-xs text-gray-500">Max 5000 characters. Shown next to racing number on the driver page.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Podiums Total
              </label>
              <input
                type="number"
                value={formData.podiums_total}
                onChange={(e) => setFormData({ ...formData, podiums_total: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Standing
              </label>
              <input
                type="number"
                value={formData.current_standing}
                onChange={(e) => setFormData({ ...formData, current_standing: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                World Championships
              </label>
              <input
                type="number"
                value={formData.world_championships}
                onChange={(e) => setFormData({ ...formData, world_championships: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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

