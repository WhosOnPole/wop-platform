'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'

const pollSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  is_featured_podium: z.boolean(),
  ends_at: z.string().optional().nullable(),
})

interface PollModalProps {
  poll: {
    id: string
    question: string
    options: string[]
    is_featured_podium: boolean
    ends_at?: string | null
  } | null
  onClose: () => void
}

export function PollModal({ poll, onClose }: PollModalProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: poll?.question || '',
    options: poll?.options || ['', ''],
    is_featured_podium: poll?.is_featured_podium || false,
    ends_at: poll?.ends_at
      ? new Date(poll.ends_at).toISOString().slice(0, 16)
      : '',
  })

  function addOption() {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    })
  }

  function removeOption(index: number) {
    if (formData.options.length <= 2) return
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const validated = pollSchema.parse({
        question: formData.question,
        options: formData.options.filter((opt) => opt.trim() !== ''),
        is_featured_podium: formData.is_featured_podium,
        ends_at: formData.ends_at ? formData.ends_at : null,
      })

      if (validated.options.length < 2) {
        throw new Error('Poll must have at least 2 options')
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      if (poll) {
        const payload = {
          ...validated,
          admin_id: session.user.id,
          ends_at: validated.ends_at ? new Date(validated.ends_at).toISOString() : null,
        }
        const { error: updateError } = await supabase
          .from('polls')
          .update(payload)
          .eq('id', poll.id)

        if (updateError) throw updateError
      } else {
        const payload = {
          question: validated.question,
          options: validated.options,
          is_featured_podium: validated.is_featured_podium,
          admin_id: session.user.id,
          ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
        const { error: insertError } = await supabase.from('polls').insert(payload)

        if (insertError) throw insertError
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save poll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {poll ? 'Edit Poll' : 'Create Poll'}
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
            <label className="block text-sm font-medium text-gray-700">Question *</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options * (at least 2)
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="mb-2 flex items-center space-x-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  required
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-900"
            >
              <Plus className="h-4 w-4" />
              <span>Add Option</span>
            </button>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_featured_podium"
              checked={formData.is_featured_podium}
              onChange={(e) => setFormData({ ...formData, is_featured_podium: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_featured_podium" className="ml-2 text-sm text-gray-700">
              Featured Podium
            </label>
          </div>

          {poll ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ends At <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Poll is active while ends_at is empty or in the future.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">You have 24 hours to vote. Polls stay visible for 30 days.</p>
          )}

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

