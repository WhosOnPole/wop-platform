'use client'

import Link from 'next/link'
import { useState } from 'react'

interface DriverHeroPanelProps {
  driver: {
    id: string
    name: string
    headshot_url: string | null
    image_url: string | null
  }
  driverSlug: string
  profileImageUrl: string | null
  localProfileUrl: string
}

export function DriverHeroPanel({
  driver,
  driverSlug,
  profileImageUrl,
  localProfileUrl,
}: DriverHeroPanelProps) {
  const [profileError, setProfileError] = useState(false)
  const [localProfileError, setLocalProfileError] = useState(false)

  const showRemoteProfile = profileImageUrl && !profileError
  const showLocalProfile =
    (profileError || !profileImageUrl) && !localProfileError
  const showDbFallback =
    (profileError || !profileImageUrl) && localProfileError

  return (
    <Link
      href={`/drivers/${driverSlug}`}
      className="group relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 transition-all hover:scale-105"
    >
      {showRemoteProfile && profileImageUrl && (
        <img
          src={profileImageUrl}
          alt={driver.name}
          className="h-full w-full object-cover"
          onError={() => setProfileError(true)}
        />
      )}
      {showLocalProfile && (
        <img
          src={localProfileUrl}
          alt={driver.name}
          className="h-full w-full object-cover"
          onError={() => setLocalProfileError(true)}
        />
      )}
      {showDbFallback && (
        <>
          {driver.headshot_url ? (
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
        </>
      )}
      {/* Driver name overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <p className="text-lg font-semibold text-white">{driver.name}</p>
      </div>
    </Link>
  )
}

