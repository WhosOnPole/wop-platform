'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getDriverBodyImageUrl } from '@/utils/storage-urls'

/** Pull image down to avoid top clipping; ~15% from top anchors to center */
const BODY_OBJECT_POSITION = '50% -5.5%'
/** Light zoom; keep top visible */
const BODY_SCALE = 1.2

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
    <div className={`relative overflow-hidden ${className}`}>
      {showBody && bodyUrl && (
        <Image
          src={bodyUrl}
          alt=""
          fill
          sizes="360px"
          className="object-cover"
          style={{ objectPosition: BODY_OBJECT_POSITION, transform: `scale(${BODY_SCALE})` }}
          onError={() => setUseFallback(true)}
          aria-hidden
        />
      )}
      {showFallback && fallbackSrc && (
        <Image
          src={fallbackSrc}
          alt=""
          fill
          sizes="360px"
          className="object-cover object-top"
          style={{ transform: `scale(${BODY_SCALE})` }}
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
