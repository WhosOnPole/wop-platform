'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Save } from 'lucide-react'
import { getTrackSlug } from '@/utils/storage-urls'
import { GridEditCanvas, type GridEditCanvasRankItem } from '@/components/grids/grid-edit-canvas'

interface OnboardingTracksStepProps {
  onComplete: () => void
  onSkip: () => void
}

function placeholderItem(index: number): GridEditCanvasRankItem {
  return { id: `__placeholder__${index}`, name: '', is_placeholder: true }
}

function padToTen(items: GridEditCanvasRankItem[]): GridEditCanvasRankItem[] {
  const out: GridEditCanvasRankItem[] = []
  for (let i = 0; i < 10; i++) {
    out.push(items[i] ?? placeholderItem(i))
  }
  return out
}

export function OnboardingTracksStep({ onComplete, onSkip }: OnboardingTracksStepProps) {
  const supabase = createClientComponentClient()
  const [rankedList, setRankedList] = useState<GridEditCanvasRankItem[]>(() => padToTen([]))
  const [availableItems, setAvailableItems] = useState<GridEditCanvasRankItem[]>([])
  const [blurb, setBlurb] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined

  useEffect(() => {
    loadTracks()
  }, [])

  async function loadTracks() {
    setLoading(true)
    try {
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, name, image_url, location, country')
        .order('name')

      if (tracks) {
        const catalog: GridEditCanvasRankItem[] = tracks.map((t) => ({
          id: t.id,
          name: t.name,
          image_url: t.image_url,
          location: t.location ?? null,
          country: t.country ?? null,
          track_slug: getTrackSlug(t.name),
        }))
        setAvailableItems(catalog)
      }
    } catch (error) {
      console.error('Error loading tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRankedListChange = useCallback((items: GridEditCanvasRankItem[]) => {
    setRankedList(items)
  }, [])

  async function handleSave() {
    const realItems = rankedList.filter((i) => !i.is_placeholder)
    if (realItems.length === 0) {
      alert('Please add at least one track to your grid')
      return
    }

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const rankedItemIds = realItems.map((item) => ({ id: item.id, name: item.name }))

    const { data: existing } = await supabase
      .from('grids')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('type', 'track')
      .maybeSingle()

    let error
    if (existing) {
      const { error: updateError } = await supabase
        .from('grids')
        .update({
          ranked_items: rankedItemIds,
          blurb: blurb.trim() || null,
        })
        .eq('id', existing.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('grids').insert({
        user_id: session.user.id,
        type: 'track',
        ranked_items: rankedItemIds,
        blurb: blurb.trim() || null,
      })
      error = insertError
    }

    if (error) {
      console.error('Error saving grid:', error)
      alert('Failed to save grid')
    } else {
      onComplete()
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const hasAtLeastOne = rankedList.some((i) => !i.is_placeholder)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Your Top 10 Tracks</h2>
        <p className="mt-1 text-sm text-gray-600">
          Drag cards onto the grid to rank your favorites. Drag back to the row to remove.
        </p>
      </div>

      <div className="rounded-xl border border-gray-300 bg-gray-900 p-4 text-white">
        <GridEditCanvas
          type="track"
          rankedList={rankedList}
          onRankedListChange={handleRankedListChange}
          availableItems={availableItems}
          supabaseUrl={supabaseUrl}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Blurb (optional, max 140 characters)
        </label>
        <textarea
          id="track-blurb"
          name="track-blurb"
          value={blurb}
          onChange={(e) => {
            if (e.target.value.length <= 140) setBlurb(e.target.value)
          }}
          rows={2}
          placeholder="Say something about your track picks..."
          autoComplete="off"
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          spellCheck={false}
          role="textbox"
          aria-label="Track grid blurb"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">{blurb.length}/140 characters</p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || !hasAtLeastOne}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Complete Onboarding</span>
        </button>
      </div>
    </div>
  )
}
