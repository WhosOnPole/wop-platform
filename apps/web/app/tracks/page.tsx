import { createClient } from '@supabase/supabase-js'
import { TrackCard } from '@/components/tracks/track-card'

export const revalidate = 3600 // Revalidate every hour

export default async function TracksPage() {
  // Use public client for static generation (no cookies needed)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase public env vars are missing for tracks page')
    notFound()
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!)

  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('*')
    .order('name', { ascending: true })

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
            <TrackCard
              key={track.id}
              track={track}
              slug={slug}
            />
          )
        })}
      </div>
    </div>
  )
}
