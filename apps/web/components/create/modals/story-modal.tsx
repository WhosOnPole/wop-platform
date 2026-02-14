'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'

interface StoryModalProps {
  onClose: () => void
}

export function StoryModal({ onClose }: StoryModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!image) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function reset() {
    setTitle('')
    setSummary('')
    setBody('')
    setImage(null)
    setImagePreview(null)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      setError('You must be signed in to submit a story.')
      setSubmitting(false)
      return
    }

    let imageUrl: string | null = null
    if (image) {
      const fileExt = image.name.split('.').pop() || 'jpg'
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('story-images')
        .upload(fileName, image, { upsert: true })

      if (uploadError) {
        setError('Failed to upload image. Please try again.')
        setSubmitting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('story-images').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('user_story_submissions').insert({
      user_id: session.user.id,
      title: title.trim(),
      summary: summary.trim() || null,
      content: body.trim(),
      image_url: imageUrl,
      status: 'pending_approval',
    })

    if (insertError) {
      setError(insertError.message ?? 'Failed to submit story.')
      setSubmitting(false)
      return
    }

    reset()
    setSubmitting(false)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1D1D1D] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Submit a story</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          <p className="text-xs text-white/60">
            Story will go to admin dashboard as “user story” for approval. Once approved, it will
            appear in the feed.
          </p>
          <div>
            <label className="block text-sm font-medium text-white/90">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="Enter story title"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-white/90">Body</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="Tell your story..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Image (optional)</label>
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
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/20 bg-white/5 transition-colors hover:bg-white/10"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 text-center text-xs text-white">
                    Change
                  </span>
                </>
              ) : (
                <Plus className="h-6 w-6 text-white/70" />
              )}
            </button>
          </div>


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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
