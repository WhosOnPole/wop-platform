'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getDriverBodyImageUrl } from '@/utils/storage-urls'

const DRIVER_BODY_OBJECT_POSITION = '50% 0%'

interface DriverCardMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  sizes: string
  className?: string
  bodyObjectPosition?: string
}

/**
 * Presentational: base layer (driver_bg.png) + driver body from storage (top-cropped),
 * with fallback to headshot_url/image_url when body.png is missing.
 */
export function DriverCardMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  sizes,
  className = '',
  bodyObjectPosition = DRIVER_BODY_OBJECT_POSITION,
}: DriverCardMediaProps) {
  const [useFallback, setUseFallback] = useState(false)

  const bodyUrl = supabaseUrl ? getDriverBodyImageUrl(driverName, supabaseUrl) : null
  const showBody = bodyUrl && !useFallback
  const showFallback = (useFallback && fallbackSrc) || (!bodyUrl && fallbackSrc)

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[url('/images/driver_bg.png')] bg-cover bg-center ${className}`}
    >
      {showBody && (
        <Image
          src={bodyUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: bodyObjectPosition }}
          onError={() => setUseFallback(true)}
          aria-hidden
        />
      )}
      {showFallback && (
        <div className="absolute inset-0 p-2">
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

