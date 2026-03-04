'use client'

import Link from 'next/link'

interface TrackCardProps {
  track: {
    id: string
    name: string
    location: string | null
    country: string | null
    altitude: number | null
    laps?: number | null
    overview_text: string | null
  }
  slug: string
}

export function TrackCard({ track, slug }: TrackCardProps) {
  return (
    <Link
      href={`/tracks/${slug}`}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-all hover:shadow-lg hover:scale-105"
    >
      {/* Track image placeholder */}
      <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <span className="text-4xl font-bold text-gray-400">
          {track.name.charAt(0)}
        </span>
      </div>

      {/* Track Info */}
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {track.name}
        </h3>
        
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {track.location && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {track.location}
            </span>
          )}
          {track.country && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {track.country}
            </span>
          )}
          {track.altitude !== null && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {track.altitude}m
            </span>
          )}
          {track.laps != null && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {track.laps} laps
            </span>
          )}
        </div>

        {track.overview_text && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
            {track.overview_text}
          </p>
        )}
      </div>
    </Link>
  )
}

