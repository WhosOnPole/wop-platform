'use client'

import Link from 'next/link'
import Image from 'next/image'

interface TrackCardProps {
  track: {
    id: string
    name: string
    image_url: string | null
    location: string | null
    country: string | null
    altitude: number | null
    track_length: string | null
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
      {/* Track Image */}
      <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200">
        {track.image_url ? (
          <Image
            src={track.image_url}
            alt={track.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-gray-400">
              {track.name.charAt(0)}
            </span>
          </div>
        )}
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
          {track.track_length && (
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {track.track_length} km
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

