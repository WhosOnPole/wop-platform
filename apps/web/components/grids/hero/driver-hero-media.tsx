'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  getDriverLocalProfileUrl,
  getDriverProfileImageUrl,
} from '@/utils/storage-urls'

interface DriverHeroMediaProps {
  driverName: string
  supabaseUrl?: string
  fallbackSrc?: string | null
  className?: string
  /** Size in px for the circular image; omit to fill container (responsive) */
  size?: number
}

export function DriverHeroMedia({
  driverName,
  supabaseUrl,
  fallbackSrc,
  className = '',
  size,
}: DriverHeroMediaProps) {
  const [useProfileFallback, setUseProfileFallback] = useState(false)
  const [useLocalProfileFallback, setUseLocalProfileFallback] = useState(false)
  const profileUrl = supabaseUrl ? getDriverProfileImageUrl(driverName, supabaseUrl) : null
  const localProfileUrl = getDriverLocalProfileUrl(driverName)
  const showProfile = profileUrl && !useProfileFallback
  const showLocalProfile =
    (useProfileFallback || !profileUrl) && !useLocalProfileFallback
  const showFallback =
    (useProfileFallback && useLocalProfileFallback && fallbackSrc) ||
    (!profileUrl && fallbackSrc)

  const sizeStyle =
    size != null
      ? { width: size, height: size, minWidth: size, minHeight: size }
      : { width: '100%', height: '100%', minWidth: 0, minHeight: 0 }

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={sizeStyle}
    >
      {showProfile && profileUrl && (
        <img
          src={profileUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setUseProfileFallback(true)}
          aria-hidden
        />
      )}
      {showLocalProfile && (
        <img
          src={localProfileUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          onError={() => setUseLocalProfileFallback(true)}
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
      {!showProfile && !showLocalProfile && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#d9d9d9]/25 text-white text-2xl font-bold">
          {driverName.charAt(0)}
        </div>
      )}
    </div>
  )
}
