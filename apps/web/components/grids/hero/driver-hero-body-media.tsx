'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getDriverBodyImageUrl } from '@/utils/storage-urls'

/** Same object-position as grid squares: enlarged so only the top half of body.png is shown */
const BODY_OBJECT_POSITION = '50% 0%'

interface DriverHeroBodyMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  className?: string
}

/**
 * Hero display using driver body.png from storage (top-half crop, like grid squares),
 * with fallback to headshot/image_url or initial letter when body is missing.
 */
export function DriverHeroBodyMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  className = '',
}: DriverHeroBodyMediaProps) {
  const [useFallback, setUseFallback] = useState(false)
  const bodyUrl = supabaseUrl ? getDriverBodyImageUrl(driverName, supabaseUrl) : null
  const showBody = bodyUrl && !useFallback
  const showFallback = (useFallback && fallbackSrc) || (!bodyUrl && fallbackSrc)

  return (
    <div className={`relative h-full w-full ${className}`}>
      {showBody && bodyUrl && (
        <Image
          src={bodyUrl}
          alt=""
          fill
          sizes="320px"
          className="object-cover"
          style={{ objectPosition: BODY_OBJECT_POSITION }}
          onError={() => setUseFallback(true)}
          aria-hidden
        />
      )}
      {showFallback && fallbackSrc && (
        <Image
          src={fallbackSrc}
          alt=""
          fill
          sizes="320px"
          className="object-cover object-top"
          aria-hidden
          unoptimized={typeof fallbackSrc === 'string' && fallbackSrc.startsWith('http')}
        />
      )}
      {!showBody && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#d9d9d9]/25 text-white text-2xl font-bold">
          {driverName.charAt(0)}
        </div>
      )}
    </div>
  )
}
