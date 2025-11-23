import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'

interface FeaturedGridProps {
  highlightedFan: {
    id: string
    username: string
    profile_image_url: string | null
  }
}

export async function FeaturedGrid({ highlightedFan }: FeaturedGridProps) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch one of their grids (most recent)
  const { data: grid } = await supabase
    .from('grids')
    .select('*')
    .eq('user_id', highlightedFan.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!grid) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow">
        <p className="text-gray-500">
          <Link href={`/u/${highlightedFan.username}`} className="text-bright-teal hover:text-racing-orange">
            {highlightedFan.username}
          </Link>{' '}
          hasn&apos;t created any grids yet.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center space-x-3">
        {highlightedFan.profile_image_url && (
          <img
            src={highlightedFan.profile_image_url}
            alt={highlightedFan.username}
            className="h-12 w-12 rounded-full object-cover"
          />
        )}
        <div>
          <Link
            href={`/u/${highlightedFan.username}`}
            className="text-lg font-semibold text-foundation-black hover:text-bright-teal"
          >
            {highlightedFan.username}
          </Link>
          <p className="text-sm text-gray-500">Featured Fan of the Week</p>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Top {grid.type === 'driver' ? 'Drivers' : grid.type === 'team' ? 'Teams' : 'Tracks'}
        </h3>
        {grid.comment && (
          <p className="mb-4 text-gray-600">&quot;{grid.comment}&quot;</p>
        )}
        <div className="space-y-2">
          {Array.isArray(grid.ranked_items) &&
            grid.ranked_items.slice(0, 5).map((item: any, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-3 rounded-md bg-gray-50 p-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-racing-orange text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-gray-900">{item.name || 'Unknown'}</span>
              </div>
            ))}
        </div>
      </div>

      <Link
        href={`/u/${highlightedFan.username}`}
        className="text-sm text-bright-teal hover:text-racing-orange font-medium"
      >
        View all grids by {highlightedFan.username} →
      </Link>
    </div>
  )
}

