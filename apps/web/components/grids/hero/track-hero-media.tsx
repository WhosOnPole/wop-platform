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
  const svgUrl = supabaseUrl && trackSlug ? getTrackSvgUrl(trackSlug, supabaseUrl) : null

  if (!svgUrl || failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight: 200 }}
        aria-label={trackName}
      />
    )
  }

  return (
    <div className={`relative flex items-center justify-center w-full max-w-[min(80vw,320px)] ${className}`}>
      <img
        src={svgUrl}
        alt=""
        className="h-full max-h-full w-auto object-contain"
        onError={() => setFailed(true)}
        aria-hidden
      />
    </div>
  )
}
