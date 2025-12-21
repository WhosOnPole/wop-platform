'use client'

import Link from 'next/link'
import { useState } from 'react'
import { getDriverProfileImageUrl } from '@/utils/storage-urls'

interface DriverHeroPanelProps {
  driver: {
    id: string
    name: string
    headshot_url: string | null
    image_url: string | null
  }
  driverSlug: string
  profileImageUrl: string | null
}

export function DriverHeroPanel({
  driver,
  driverSlug,
  profileImageUrl,
}: DriverHeroPanelProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      href={`/drivers/${driverSlug}`}
      className="group relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 transition-all hover:scale-105"
    >
      {profileImageUrl && !imageError ? (
        <img
          src={profileImageUrl}
          alt={driver.name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : driver.headshot_url ? (
        <img
          src={driver.headshot_url}
          alt={driver.name}
          className="h-full w-full object-cover"
        />
      ) : driver.image_url ? (
        <img
          src={driver.image_url}
          alt={driver.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="text-4xl font-bold text-gray-400">
            {driver.name.charAt(0)}
          </span>
        </div>
      )}
      {/* Driver name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-lg font-semibold text-white">{driver.name}</p>
      </div>
    </Link>
  )
}

