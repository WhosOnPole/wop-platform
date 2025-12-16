'use client'

import { useTracks } from '@/hooks/use-tracks'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function TracksPage() {
  const { data: tracks, isLoading, error } = useTracks()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tracks</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 tracks
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
          <h1 className="text-3xl font-bold text-gray-900">Tracks</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 tracks
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
          <p className="text-red-800">
            Error loading tracks. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tracks</h1>
          <p className="mt-2 text-gray-600">
            Explore all Formula 1 tracks
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No tracks available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tracks</h1>
        <p className="mt-2 text-gray-600">
          Explore all Formula 1 tracks
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tracks.map((track) => {
          // Generate slug from track name
          const slug = track.name.toLowerCase().replace(/\s+/g, '-')
          
          return (
            <Link
              key={track.id}
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
        })}
      </div>
    </div>
  )
}
