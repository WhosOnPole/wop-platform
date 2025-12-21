'use client'

import Link from 'next/link'
import Image from 'next/image'

interface DriverCardProps {
  driver: {
    id: string
    name: string
    headshot_url: string | null
    image_url: string | null
    racing_number: number | null
    age: number | null
    nationality: string | null
    podiums_total: number | null
    world_championships: number | null
    current_standing: number | null
    teams?: {
      id: string
      name: string
      image_url: string | null
    } | null
  }
  slug: string
}

export function DriverCard({ driver, slug }: DriverCardProps) {
  return (
    <Link
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
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
}

