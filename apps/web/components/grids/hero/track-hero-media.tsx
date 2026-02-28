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
        style={{ minHeight: 500 }}
        aria-label={trackName}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center w-full min-h-0 ${className}`}
    >
      <img
        src={svgUrl}
        alt=""
        className="w-full h-full max-w-full max-h-full object-contain"
        style={{ objectPosition: 'center center' }}
        onError={() => setFailed(true)}
        aria-hidden
      />
    </div>
  )
}
