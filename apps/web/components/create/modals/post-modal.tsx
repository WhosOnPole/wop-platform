'use client'

import { useState, FormEvent } from 'react'

interface PostModalProps {
  onClose: () => void
}

export function PostModal({ onClose }: PostModalProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setTitle('')
    setBody('')
    setImage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    console.info('Create post (stub):', { title, body, image })
    // TODO: create post and add to user profile + general feed immediately
    reset()
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create a post</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Share your thoughts..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-gray-700"
            />
          </div>

          <p className="text-xs text-gray-500">
            Post will appear on your profile and the general feed immediately.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
