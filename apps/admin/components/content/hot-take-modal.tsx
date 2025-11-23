'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const hotTakeSchema = z.object({
  content_text: z.string().min(1),
  featured_grid_id: z.string().uuid().optional().or(z.literal('')),
  active_date: z.string().date(),
})

interface HotTakeModalProps {
  hotTake: {
    id: string
    content_text: string
    featured_grid_id: string | null
    active_date: string
  } | null
  onClose: () => void
}

export function HotTakeModal({ hotTake, onClose }: HotTakeModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    content_text: hotTake?.content_text || '',
    featured_grid_id: hotTake?.featured_grid_id || '',
    active_date: hotTake?.active_date || new Date().toISOString().split('T')[0],
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = hotTakeSchema.parse({
        ...formData,
        featured_grid_id: formData.featured_grid_id || undefined,
      })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const payload = {
        content_text: validated.content_text,
        featured_grid_id: validated.featured_grid_id || null,
        active_date: validated.active_date,
        admin_id: session.user.id,
      }

      if (hotTake) {
        const { error: updateError } = await supabase
          .from('hot_takes')
          .update(payload)
          .eq('id', hotTake.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('hot_takes').insert(payload)

        if (insertError) throw insertError
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save hot take')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {hotTake ? 'Edit Hot Take' : 'Create Hot Take'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Content Text *</label>
            <textarea
              value={formData.content_text}
              onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
              required
              rows={6}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Featured Grid ID</label>
            <input
              type="text"
              value={formData.featured_grid_id}
              onChange={(e) => setFormData({ ...formData, featured_grid_id: e.target.value })}
              placeholder="Optional: UUID of a grid to feature"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Active Date *</label>
            <input
              type="date"
              value={formData.active_date}
              onChange={(e) => setFormData({ ...formData, active_date: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              This hot take will be shown on this date (typically a Tuesday)
            </p>
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
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

