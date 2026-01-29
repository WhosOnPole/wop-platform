'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getDriverProfileImageUrl } from '@/utils/storage-urls'

interface DriverHeroMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  className?: string
  /** Size in px for the circular image (default 280) */
  size?: number
}

export function DriverHeroMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  className = '',
  size = 280,
}: DriverHeroMediaProps) {
  const [useFallback, setUseFallback] = useState(false)
  const profileUrl = supabaseUrl ? getDriverProfileImageUrl(driverName, supabaseUrl) : null
  const showProfile = profileUrl && !useFallback
  const showFallback = (useFallback && fallbackSrc) || (!profileUrl && fallbackSrc)

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {showProfile && (
        <img
          src={profileUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setUseFallback(true)}
          aria-hidden
        />
      )}
      {showFallback && fallbackSrc && (
        <Image
          src={fallbackSrc}
          alt=""
          fill
          sizes="280px"
          className="object-cover object-top"
          aria-hidden
          unoptimized={typeof fallbackSrc === 'string' && fallbackSrc.startsWith('http')}
        />
      )}
      {!showProfile && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#d9d9d9]/25 text-white text-2xl font-bold">
          {driverName.charAt(0)}
        </div>
      )}
    </div>
  )
}
