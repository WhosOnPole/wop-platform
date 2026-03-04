'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Save } from 'lucide-react'
import { getTrackSlug } from '@/utils/storage-urls'
import { GridEditCanvas, type GridEditCanvasRankItem } from '@/components/grids/grid-edit-canvas'
import type { GridType } from '@/components/grids/grid-edit-canvas'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapRowFn = (row: any) => GridEditCanvasRankItem

interface GridStepConfig {
  type: GridType
  table: string
  select: string
  hasActiveFilter?: boolean
  mapRow: MapRowFn
  title: string
  description: string
  blurbPlaceholder: string
  emptyAlert: string
  buttonLabel: string
  skipLabel: string
}

const GRID_STEP_CONFIG: Record<GridType, GridStepConfig> = {
  driver: {
    type: 'driver',
    table: 'drivers',
    select: 'id, name, image_url, headshot_url',
    hasActiveFilter: true,
    mapRow: (d) => ({
      id: d.id,
      name: d.name,
      image_url: d.image_url,
      headshot_url: d.headshot_url ?? null,
    }),
    title: 'Select Your Top 10 Drivers',
    description:
      'Drag cards onto the grid to rank your favorites. Drag back to the row to remove. Your top pick is the large slot on the left.',
    blurbPlaceholder: 'Say something about your driver picks...',
    emptyAlert: 'Please add at least one driver to your grid',
    buttonLabel: 'Continue',
    skipLabel: 'Skip',
  },
  team: {
    type: 'team',
    table: 'teams',
    select: 'id, name, image_url',
    hasActiveFilter: true,
    mapRow: (t) => ({
      id: t.id,
      name: t.name,
      image_url: t.image_url,
    }),
    title: 'Select Your Top 10 Teams',
    description: 'Drag cards onto the grid to rank your favorites. Drag back to the row to remove.',
    blurbPlaceholder: 'Say something about your team picks...',
    emptyAlert: 'Please add at least one team to your grid',
    buttonLabel: 'Continue',
    skipLabel: 'Skip',
  },
  track: {
    type: 'track',
    table: 'tracks',
    select: 'id, name, location, country',
    hasActiveFilter: false,
    mapRow: (t) => ({
      id: t.id,
      name: t.name,
      image_url: null,
      location: t.location ?? null,
      country: t.country ?? null,
      track_slug: getTrackSlug(t.name),
    }),
    title: 'Select Your Top 10 Tracks',
    description: 'Drag cards onto the grid to rank your favorites. Drag back to the row to remove.',
    blurbPlaceholder: 'Say something about your track picks...',
    emptyAlert: 'Please add at least one track to your grid',
    buttonLabel: 'Save & Finish',
    skipLabel: 'Skip + Login',
  },
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

interface OnboardingGridStepProps {
  type: GridType
  onComplete: () => void
  onSkip: () => void
}

export function OnboardingGridStep({ type, onComplete, onSkip }: OnboardingGridStepProps) {
  const supabase = createClientComponentClient()
  const config = GRID_STEP_CONFIG[type]
  const [rankedList, setRankedList] = useState<GridEditCanvasRankItem[]>(() => padToTen([]))
  const [availableItems, setAvailableItems] = useState<GridEditCanvasRankItem[]>([])
  const [blurb, setBlurb] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined

  useEffect(() => {
    const cfg = GRID_STEP_CONFIG[type]
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        let query = supabase.from(cfg.table).select(cfg.select).order('name')
        if (cfg.hasActiveFilter) {
          query = query.eq('active', true)
        }
        const { data: rows } = await query
        if (!cancelled && rows) {
          setAvailableItems(rows.map(cfg.mapRow))
        }
      } catch (error) {
        if (!cancelled) console.error(`Error loading ${cfg.table}:`, error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [type, supabase])

  const handleRankedListChange = useCallback((items: GridEditCanvasRankItem[]) => {
    setRankedList(items)
  }, [])

  async function handleSave() {
    const realItems = rankedList.filter((i) => !i.is_placeholder)
    if (realItems.length === 0) {
      alert(config.emptyAlert)
      return
    }

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsSubmitting(false)
      return
    }

    const rankedItemIds = realItems.map((item) => ({ id: item.id, name: item.name }))

    const { data: existing } = await supabase
      .from('grids')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('type', config.type)
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
        type: config.type,
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  const hasAtLeastOne = rankedList.some((i) => !i.is_placeholder)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal text-white">{config.title}</h2>
        <p className="mt-1 text-sm text-white/70">{config.description}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-white backdrop-blur-sm">
        <GridEditCanvas
          type={config.type}
          rankedList={rankedList}
          onRankedListChange={handleRankedListChange}
          availableItems={availableItems}
          supabaseUrl={supabaseUrl}
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
        >
          {config.skipLabel}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting || !hasAtLeastOne}
          className="flex items-center space-x-2 rounded-lg bg-[#25B4B1] px-6 py-2 text-sm font-medium text-white hover:bg-[#25B4B1]/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{config.buttonLabel}</span>
        </button>
      </div>
    </div>
  )
}
