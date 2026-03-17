'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  getDriverBodyImageUrl,
  getDriverLocalBodyUrl,
  getDriverProfileImageUrl,
} from '@/utils/storage-urls'

/** Position so shoulders and up stay in frame when zoomed */
const BODY_OBJECT_POSITION = '50% -8%'
/** Zoom in to show shoulders and up only */
const BODY_SCALE = 1.4

interface DriverHeroBodyMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  className?: string
}

/**
 * Hero display using driver body.png from storage (top-half crop, like grid squares),
 * with fallback to local body.png, then profile.jpg from storage, then headshot/image_url from DB, or initial letter.
 * Local body images are only requested when remote fails (e.g. Vercel image optimization limits).
 */
export function DriverHeroBodyMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  className = '',
}: DriverHeroBodyMediaProps) {
  const [useBodyFallback, setUseBodyFallback] = useState(false)
  const [useLocalBodyFallback, setUseLocalBodyFallback] = useState(false)
  const [useProfileFallback, setUseProfileFallback] = useState(false)
  const bodyUrl = supabaseUrl ? getDriverBodyImageUrl(driverName, supabaseUrl) : null
  const localBodyUrl = getDriverLocalBodyUrl(driverName)
  const profileUrl = supabaseUrl ? getDriverProfileImageUrl(driverName, supabaseUrl) : null
  const showBody = bodyUrl && !useBodyFallback
  const showLocalBody = useBodyFallback && !useLocalBodyFallback
  const showProfile = useBodyFallback && useLocalBodyFallback && !useProfileFallback
  const showDbFallback =
    (useBodyFallback &&
      useLocalBodyFallback &&
      (useProfileFallback || !profileUrl) &&
      fallbackSrc) ||
    (!bodyUrl && !profileUrl && fallbackSrc)

  const showInitial = !showBody && !showLocalBody && !showProfile && !showDbFallback

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
          onError={() => setUseBodyFallback(true)}
          aria-hidden
        />
      )}
      {showLocalBody && (
        <Image
          src={localBodyUrl}
          alt=""
          fill
          sizes="360px"
          className="object-cover object-top"
          style={{ objectPosition: BODY_OBJECT_POSITION, transform: `scale(${BODY_SCALE})` }}
          onError={() => setUseLocalBodyFallback(true)}
          aria-hidden
          unoptimized
        />
      )}
      {showProfile && profileUrl && (
        <Image
          src={profileUrl}
          alt=""
          fill
          sizes="360px"
          className="object-cover object-top"
          style={{ objectPosition: BODY_OBJECT_POSITION, transform: `scale(${BODY_SCALE})` }}
          onError={() => setUseProfileFallback(true)}
          aria-hidden
        />
      )}
      {showDbFallback && fallbackSrc && (
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
      {showInitial && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#d9d9d9]/25 text-white text-2xl font-bold">
          {driverName.charAt(0)}
        </div>
      )}
    </div>
  )
}
