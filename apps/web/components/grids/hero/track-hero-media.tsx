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

  const translateY = trackName === 'Circuit Gilles-Villeneuve' ? '40%' : '20%'

  return (
    <div
      className={`flex items-start justify-center w-full ${className}`}
      style={{ minWidth: 390, minHeight: 450, transform: `translateY(${translateY})` }}
    >
      <img
        src={svgUrl}
        alt=""
        className="max-h-full max-w-full w-auto object-contain object-top"
        style={{ objectPosition: 'center bottom' }}
        onError={() => setFailed(true)}
        aria-hidden
      />
    </div>
  )
}
