'use client'

import { useState } from 'react'
import { getTrackSvgUrl } from '@/utils/storage-urls'

interface TrackHeroMediaProps {
  trackSlug: string
  trackName: string
  supabaseUrl?: string
  className?: string
}

export function TrackHeroMedia({
  trackSlug,
  trackName,
  supabaseUrl,
  className = '',
}: TrackHeroMediaProps) {
  const [failed, setFailed] = useState(false)
  const svgUrl = supabaseUrl ? getTrackSvgUrl(trackSlug, supabaseUrl) : null

  if (!svgUrl || failed) {
    return (
      <div
        className={`flex items-center justify-center text-white/60 text-lg ${className}`}
        style={{ minHeight: 200 }}
      >
        {trackName}
      </div>
    )
  }

  return (
    <div className={`relative flex items-center justify-center w-full max-w-[min(80vw,320px)] ${className}`}>
      <img
        src={svgUrl}
        alt=""
        className="max-h-[min(50vh,280px)] w-auto object-contain"
        onError={() => setFailed(true)}
        aria-hidden
      />
    </div>
  )
}
