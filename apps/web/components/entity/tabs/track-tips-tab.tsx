'use client'

import { useState } from 'react'
import { TrackSubmissionsTab } from './track-submissions-tab'

interface TrackTip {
  id: string
  tip_content: string
  image_url?: string | null
  created_at: string
  user?: {
    id: string
    username: string
    profile_image_url?: string | null
  } | null
}

type TipsSubtab = 'general' | 'stay' | 'transit'

interface TrackTipsTabProps {
  trackTips: TrackTip[]
  trackStays: TrackTip[]
  trackTransit: TrackTip[]
}

const SUBTABS: { id: TipsSubtab; label: string; typeLabel: string }[] = [
  { id: 'general', label: 'General', typeLabel: 'General tips' },
  { id: 'stay', label: 'Stay', typeLabel: 'Stay tips' },
  { id: 'transit', label: 'Transit', typeLabel: 'Transit tips' },
]

export function TrackTipsTab({
  trackTips,
  trackStays,
  trackTransit,
}: TrackTipsTabProps) {
  const [activeSubtab, setActiveSubtab] = useState<TipsSubtab>('general')

  const submissionsBySubtab = {
    general: trackTips,
    stay: trackStays,
    transit: trackTransit,
  }

  const activeSubtabConfig = SUBTABS.find((t) => t.id === activeSubtab)!
  const activeSubmissions = submissionsBySubtab[activeSubtab]

  return (
    <div className="space-y-4">
      <nav
        className="-mb-px flex w-full border-b border-white/20"
        role="tablist"
        aria-label="Tip categories"
      >
        {SUBTABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSubtab === tab.id}
            onClick={() => setActiveSubtab(tab.id)}
            className={`w-1/3 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeSubtab === tab.id
                ? 'border-bright-teal text-white'
                : 'border-transparent text-white/70 hover:border-white/30 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <TrackSubmissionsTab
        submissions={activeSubmissions}
        typeLabel={activeSubtabConfig.typeLabel}
      />
    </div>
  )
}
