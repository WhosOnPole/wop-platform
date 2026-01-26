'use client'

import { useState, FormEvent, useRef } from 'react'
import { X, Plus } from 'lucide-react'

interface StoryModalProps {
  onClose: () => void
}

export function StoryModal({ onClose }: StoryModalProps) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle('')
    setSummary('')
    setBody('')
    setImage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    console.info('Submit story (stub):', { title, summary, body, image })
    // TODO: call API to create story with status=pending_approval; rename "news stories" to "user stories"
    reset()
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1D1D1D] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Submit a story</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-xs text-gray-500">
            Story will go to admin dashboard as “user story” for approval. Once approved, it will
            appear in the feed.
          </p>
          <div>
            <label className="block text-sm font-medium text-white">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter story title"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-white">Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Tell your story..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Image (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-20 h-20 border-2 border-white border-dashed rounded-lg bg-transparent hover:bg-white/10 transition-colors"
            >
              <Plus className="h-6 w-6 text-white" />
            </button>
          </div>


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
              className="rounded-lg bg-transparent border border-white px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sunset-gradient hover:border-0 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
