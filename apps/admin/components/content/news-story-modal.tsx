'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { NewsStory } from './content.types'

const newsStorySchema = z.object({
  title: z.string().min(1).max(500),
  image_url: z.string().url().optional().or(z.literal('')),
  content: z.string().min(1),
  is_featured: z.boolean(),
})

interface NewsStoryModalProps {
  story: NewsStory | null
  onClose: () => void
}

export function NewsStoryModal({ story, onClose }: NewsStoryModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: story?.title || '',
    image_url: story?.image_url || '',
    content: story?.content || '',
    is_featured: story?.is_featured || false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = newsStorySchema.parse({
        ...formData,
        image_url: formData.image_url || undefined,
      })

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const payload = {
        ...validated,
        image_url: validated.image_url || null,
        admin_id: session.user.id,
      }

      if (story) {
        // Update existing
        const { error: updateError } = await supabase
          .from('news_stories')
          .update(payload)
          .eq('id', story.id)

        if (updateError) throw updateError
      } else {
        // Create new
        const { error: insertError } = await supabase.from('news_stories').insert(payload)

        if (insertError) throw insertError
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save news story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-drawer-overlay">
      <div className="admin-drawer-panel">
        <div className="admin-drawer-header">
          <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {story ? 'Edit Story' : 'Create Story'}
          </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {story ? `ID: ${story.id}` : 'New content record'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close story editor"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="admin-drawer-body space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>
        )}

          <div>
            <label className="admin-form-label">Title *</label>
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
            <label className="admin-form-label">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="admin-form-input"
            />
          </div>

          <div>
            <label className="admin-form-label">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={10}
              className="admin-form-input"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="admin-checkbox"
            />
            <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-slate-700">
              Featured Story
            </label>
          </div>
          </div>

          <div className="admin-drawer-footer">
            <button
              type="button"
              onClick={onClose}
              className="admin-button-secondary"
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

