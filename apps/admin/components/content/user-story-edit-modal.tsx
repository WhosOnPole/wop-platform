'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'

const storySchema = z.object({
  title: z.string().min(1).max(500),
  summary: z.string().max(1000).optional().nullable(),
  content: z.string().min(1),
  image_url: z.union([z.string().url(), z.literal('')]).optional(),
})

export interface UserStorySubmission {
  id: string
  user_id: string
  title: string
  summary: string | null
  content: string
  image_url: string | null
  status: string
  created_at: string
  user?: { id: string; username: string }
}

interface UserStoryEditModalProps {
  submission: UserStorySubmission
  onClose: () => void
  onSaved: () => void
}

export function UserStoryEditModal({ submission, onClose, onSaved }: UserStoryEditModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: submission.title,
    summary: submission.summary ?? '',
    content: submission.content,
    image_url: submission.image_url ?? '',
  })

  useEffect(() => {
    setFormData({
      title: submission.title,
      summary: submission.summary ?? '',
      content: submission.content,
      image_url: submission.image_url ?? '',
    })
  }, [submission])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const validated = storySchema.parse({
        ...formData,
        summary: formData.summary?.trim() || null,
        image_url: formData.image_url?.trim() || undefined,
      })

      const { error: updateError } = await supabase
        .from('user_story_submissions')
        .update({
          title: validated.title,
          summary: validated.summary ?? null,
          content: validated.content,
          image_url: (validated.image_url && validated.image_url !== '') ? validated.image_url : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id)

      if (updateError) throw updateError
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof z.ZodError ? err.errors.map((e) => e.message).join(', ') : (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Story</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={500}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              maxLength={1000}
              rows={2}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="admin-form-input"
            />
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
              className="admin-button-primary"
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
