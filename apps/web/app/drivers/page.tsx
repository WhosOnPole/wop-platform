'use client'

import { useDrivers } from '@/hooks/use-drivers'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function DriversPage() {
  const { data: drivers, isLoading, error } = useDrivers()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 drivers and their profiles
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 drivers and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
          <p className="text-red-800">
            Error loading drivers. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (!drivers || drivers.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 drivers and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No drivers available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
        <p className="mt-2 text-gray-600">
          Explore all Formula 1 drivers and their profiles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {drivers.map((driver) => {
          // Generate slug from driver name
          const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
          
          return (
            <Link
              key={driver.id}
              href={`/drivers/${slug}`}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-all hover:shadow-lg hover:scale-105"
            >
              {/* Driver Image */}
              <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                {driver.headshot_url || driver.image_url ? (
                  <Image
                    src={driver.headshot_url || driver.image_url!}
                    alt={driver.name}
                    fill
                    className="object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-bold text-gray-400">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Team Badge */}
                {driver.teams && (
                  <div className="absolute bottom-2 right-2">
                    {driver.teams.image_url ? (
                      <Image
                        src={driver.teams.image_url}
                        alt={driver.teams.name}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-white bg-white object-cover shadow-md"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-gray-600 text-white shadow-md">
                        <span className="text-xs font-bold">
                          {driver.teams.name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Driver Info */}
              <div className="p-4">
                <h3 className="mb-1 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {driver.name}
                </h3>
                
                {driver.teams && (
                  <p className="mb-2 text-sm text-gray-600">{driver.teams.name}</p>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {driver.racing_number && (
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      #{driver.racing_number}
                    </span>
                  )}
                  {driver.nationality && (
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      {driver.nationality}
                    </span>
                  )}
                  {driver.age && (
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      Age {driver.age}
                    </span>
                  )}
                </div>

                {/* Stats Preview */}
                {(driver.podiums_total !== null || driver.world_championships !== null || driver.current_standing) && (
                  <div className="mt-3 flex items-center space-x-4 border-t border-gray-100 pt-3">
                    {driver.podiums_total !== null && (
                      <div>
                        <p className="text-xs text-gray-500">Podiums</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {driver.podiums_total}
                        </p>
                      </div>
                    )}
                    {driver.world_championships !== null && (
                      <div>
                        <p className="text-xs text-gray-500">WDC</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {driver.world_championships}
                        </p>
                      </div>
                    )}
                    {driver.current_standing && (
                      <div>
                        <p className="text-xs text-gray-500">Standing</p>
                        <p className="text-sm font-semibold text-gray-900">
                          #{driver.current_standing}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
