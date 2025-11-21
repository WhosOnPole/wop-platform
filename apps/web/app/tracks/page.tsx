import { cache } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

// Cache track data per request (session-level caching)
const getCachedTracks = cache(async () => {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: tracks } = await supabase
    .from('tracks')
    .select('*')
    .order('name', { ascending: true })

  return tracks || []
})

export default async function TracksPage() {
  const tracks = await getCachedTracks()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tracks</h1>
        <p className="mt-2 text-gray-600">
          Explore all Formula 1 circuits and tracks
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No tracks available yet.</p>
        </div>
      ) : (
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
                    <img
                      src={track.image_url}
                      alt={track.name}
                      className="h-full w-full object-cover object-center"
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
                    {track.track_length && (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {track.track_length} km
                      </span>
                    )}
                    {track.built_date && (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {new Date(track.built_date).getFullYear()}
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
      )}
    </div>
  )
}

