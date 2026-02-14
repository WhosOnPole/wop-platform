'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'

interface PostModalProps {
  onClose: () => void
  referencePollId?: string
  referencePollQuestion?: string
}

export function PostModal({ onClose, referencePollId, referencePollQuestion }: PostModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasPollRef = Boolean(referencePollId && referencePollQuestion)

  function reset() {
    setTitle('')
    setBody('')
    setImage(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const supabase = createClientComponentClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setError('You must be signed in to post.')
      setSubmitting(false)
      return
    }

    const content = title.trim() ? `${title.trim()}\n\n${body.trim()}` : body.trim()
    const payload: {
      content: string
      user_id: string
      parent_page_type?: string
      parent_page_id?: string
    } = {
      content,
      user_id: session.user.id,
    }
    if (hasPollRef && referencePollId) {
      payload.parent_page_type = 'poll'
      payload.parent_page_id = referencePollId
    }

    const { error: insertError } = await supabase.from('posts').insert(payload)

    if (insertError) {
      setError(insertError.message ?? 'Failed to create post')
      setSubmitting(false)
      return
    }

    reset()
    setSubmitting(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1D1D1D] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create a post</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasPollRef && (
          <p className="mb-4 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/90">
            Posting about poll: <span className="font-medium text-white">&quot;{referencePollQuestion}&quot;</span>
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-white/90">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="Share your thoughts..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-white/70 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-white/20"
            />
          </div>

          <p className="text-xs text-white/60">
            Post will appear on your profile and the general feed immediately.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#25B4B1] px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-[#25B4B1]/90 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
