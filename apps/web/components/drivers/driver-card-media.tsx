'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getDriverBodyImageUrl, getDriverLocalBodyUrl } from '@/utils/storage-urls'

/** Position so head and shoulders are in frame and head isn't clipped */
const DRIVER_BODY_OBJECT_POSITION = '50% 0%'

interface DriverCardMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  sizes: string
  className?: string
  bodyObjectPosition?: string
  /** When true, darkens only the background layer (e.g. pitlane cards); driver image stays clear */
  darkenBackgroundOnly?: boolean
}

/**
 * Presentational: base layer (driver_bg.png) + driver body from storage (top-cropped),
 * with fallback to local body.png, then headshot_url/image_url when body.png is missing.
 * Local body images are only requested when remote fails.
 */
export function DriverCardMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  sizes,
  className = '',
  bodyObjectPosition = DRIVER_BODY_OBJECT_POSITION,
  darkenBackgroundOnly = false,
}: DriverCardMediaProps) {
  const [useBodyFallback, setUseBodyFallback] = useState(false)
  const [useLocalBodyFallback, setUseLocalBodyFallback] = useState(false)

  const bodyUrl = supabaseUrl ? getDriverBodyImageUrl(driverName, supabaseUrl) : null
  const localBodyUrl = getDriverLocalBodyUrl(driverName)
  const showBody = bodyUrl && !useBodyFallback
  const showLocalBody = useBodyFallback && !useLocalBodyFallback
  const showFallback =
    (useBodyFallback && useLocalBodyFallback && fallbackSrc) || (!bodyUrl && fallbackSrc)

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[url('/images/driver_bg.png')] bg-cover bg-center ${className}`}
    >
      {darkenBackgroundOnly && (
        <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
      )}
      {showBody && bodyUrl && (
        <Image
          src={bodyUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover relative z-10"
          style={{ objectPosition: bodyObjectPosition }}
          onError={() => setUseBodyFallback(true)}
          aria-hidden
        />
      )}
      {showLocalBody && (
        <Image
          src={localBodyUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover relative z-10"
          style={{ objectPosition: bodyObjectPosition }}
          onError={() => setUseLocalBodyFallback(true)}
          aria-hidden
          unoptimized
        />
      )}
      {showFallback && (
        <div className="absolute inset-0 z-10 p-2">
          <div className="relative h-full w-full">
            <Image
              src={fallbackSrc!}
              alt=""
              fill
              sizes={sizes}
              className="object-contain"
              aria-hidden
            />
          </div>
        </div>
      )}
    </div>
  )
}

