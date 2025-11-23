'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const driverSchema = z.object({
  image_url: z.string().url().optional().or(z.literal('')),
  team_icon_url: z.string().url().optional().or(z.literal('')),
  racing_number: z.number().int().positive().optional().or(z.null()),
  age: z.number().int().positive().max(100).optional().or(z.null()),
  nationality: z.string().max(100).optional().or(z.literal('')),
  podiums_total: z.number().int().min(0).optional(),
  current_standing: z.number().int().positive().optional().or(z.null()),
  world_championships: z.number().int().min(0).optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
})

interface DriverEditModalProps {
  driver: {
    id: string
    name: string
    image_url: string | null
    team_icon_url: string | null
    racing_number: number | null
    age: number | null
    nationality: string | null
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
  const [formData, setFormData] = useState({
    image_url: driver.image_url || '',
    team_icon_url: driver.team_icon_url || '',
    racing_number: driver.racing_number?.toString() || '',
    age: driver.age?.toString() || '',
    nationality: driver.nationality || '',
    podiums_total: driver.podiums_total.toString(),
    current_standing: driver.current_standing?.toString() || '',
    world_championships: driver.world_championships.toString(),
    instagram_url: driver.instagram_url || '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate form data
      const validated = driverSchema.parse({
        image_url: formData.image_url || undefined,
        team_icon_url: formData.team_icon_url || undefined,
        racing_number: formData.racing_number ? parseInt(formData.racing_number) : null,
        age: formData.age ? parseInt(formData.age) : null,
        nationality: formData.nationality || undefined,
        podiums_total: parseInt(formData.podiums_total),
        current_standing: formData.current_standing ? parseInt(formData.current_standing) : null,
        world_championships: parseInt(formData.world_championships),
        instagram_url: formData.instagram_url || undefined,
      })

      // Use service role for admin operations (this should be done via Server Action in production)
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          ...validated,
          image_url: validated.image_url || null,
          team_icon_url: validated.team_icon_url || null,
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
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
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
                Team Icon URL
              </label>
              <input
                type="url"
                value={formData.team_icon_url}
                onChange={(e) => setFormData({ ...formData, team_icon_url: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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

