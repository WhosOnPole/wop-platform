'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { sanitizeTipContent, validateUuid, validateTipType } from '@/utils/sanitize'

interface TipModalProps {
  onClose: () => void
}

interface TrackOption {
  id: string
  name: string
  circuit_ref: string | null
}

const TIP_TYPE_OPTIONS = [
  { value: 'tips', label: 'General' },
  { value: 'stays', label: 'Stays' },
  { value: 'transit', label: 'Transit' },
] as const

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function TipModal({ onClose }: TipModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [tracks, setTracks] = useState<TrackOption[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)
  const [trackId, setTrackId] = useState('')
  const [tipType, setTipType] = useState<'tips' | 'stays' | 'transit'>('tips')
  const [tip, setTip] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadTracks() {
      try {
        const { data, error } = await supabase
          .from('tracks')
          .select('id, name, circuit_ref')
          .order('circuit_ref', { ascending: true, nullsFirst: false })

        if (error) {
          console.error('Error loading tracks for tip modal:', error)
        }
        if (isMounted) {
          setTracks(data ?? [])
        }
      } finally {
        if (isMounted) setTracksLoading(false)
      }
    }
    loadTracks()
    return () => {
      isMounted = false
    }
  }, [supabase])

  function reset() {
    setTrackId('')
    setTipType('tips')
    setTip('')
    setImage(null)
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
      setError('You must be signed in to submit a tip.')
      setSubmitting(false)
      return
    }

    if (!validateUuid(trackId)) {
      setError('Please select a valid track.')
      setSubmitting(false)
      return
    }
    if (!validateTipType(tipType)) {
      setError('Invalid tip type.')
      setSubmitting(false)
      return
    }
    const contentResult = sanitizeTipContent(tip)
    if (!contentResult.ok) {
      setError(contentResult.error)
      setSubmitting(false)
      return
    }

    if (image) {
      if (image.size > MAX_IMAGE_SIZE_BYTES) {
        setError('Image must be 5MB or smaller.')
        setSubmitting(false)
        return
      }
      if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
        setError('Image must be JPEG, PNG, or WebP.')
        setSubmitting(false)
        return
      }
    }

    let imageUrl: string | null = null
    if (image) {
      const fileExt = image.name.split('.').pop()?.toLowerCase() || 'jpg'
      const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(fileExt) ? fileExt : 'jpg'
      const fileName = `${session.user.id}-${Date.now()}.${safeExt}`
      const { error: uploadError } = await supabase.storage
        .from('track-tip-images')
        .upload(fileName, image, { upsert: true, contentType: image.type })

      if (uploadError) {
        setError('Failed to upload image. Please try again.')
        setSubmitting(false)
        return
      }
      const { data: urlData } = supabase.storage.from('track-tip-images').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }

    const payload = {
      user_id: session.user.id,
      track_id: trackId,
      tip_content: contentResult.value,
      type: tipType,
      status: 'pending',
      image_url: imageUrl,
    }

    const { error: insertError } = await supabase.from('track_tips').insert(payload)

    if (insertError) {
      setError(insertError.message ?? 'Failed to submit tip')
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
          <h2 className="text-lg font-semibold text-white">Submit a tip</h2>
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

          <div>
            <label className="block text-sm font-medium text-white/90">Track</label>
            <select
              required
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              disabled={tracksLoading}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] disabled:opacity-60 disabled:bg-white/5"
            >
              <option value="" disabled>
                {tracksLoading ? 'Loading tracks...' : 'Select a track'}
              </option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#1D1D1D] text-white">
                  {t.circuit_ref ? `${t.circuit_ref} — ${t.name}` : t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Tip type</label>
            <select
              required
              value={tipType}
              onChange={(e) => setTipType(e.target.value as 'tips' | 'stays' | 'transit')}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
            >
              {TIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1D1D1D] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Tip</label>
            <textarea
              required
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              rows={4}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              placeholder="Share your track tip"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90">Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="mt-1 w-full text-sm text-white/70 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-white/20"
            />
          </div>

          <p className="text-xs text-white/60">
            Tip will go to the admin dashboard for approval. Once approved, it will appear on the
            track page under the section you selected.
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
              {submitting ? 'Submitting...' : 'Submit tip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
