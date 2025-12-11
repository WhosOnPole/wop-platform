import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'

interface FeaturedGridProps {
  highlightedFan: {
    id: string
    username: string
    profile_image_url: string | null
  }
}

export async function FeaturedGrid({ highlightedFan }: FeaturedGridProps) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch top 3 grids (one of each type: driver, team, track)
  const [driverGrid, teamGrid, trackGrid] = await Promise.all([
    supabase
      .from('grids')
      .select('*')
      .eq('user_id', highlightedFan.id)
      .eq('type', 'driver')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('grids')
      .select('*')
      .eq('user_id', highlightedFan.id)
      .eq('type', 'team')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('grids')
      .select('*')
      .eq('user_id', highlightedFan.id)
      .eq('type', 'track')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const grids = [
    driverGrid.data,
    teamGrid.data,
    trackGrid.data,
  ].filter(Boolean)

  if (grids.length === 0) {
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
    <div>
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

      {/* Horizontal scrolling grids container */}
      <div className="h-40 overflow-x-auto overflow-y-hidden">
        <div className="flex space-x-4">
          {grids.map((grid: any) => {
            const gridTypeLabel = grid.type === 'driver' ? 'Top Drivers' : grid.type === 'team' ? 'Top Teams' : 'Top Circuits'
            return (
              <div
                key={grid.id}
                className="flex-shrink-0 w-[calc(100vw-3rem)] sm:w-96 lg:w-1/3 h-40 rounded-lg border border-gray-200 bg-white p-4 shadow"
              >
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{gridTypeLabel}</h3>
                <div className="space-y-1">
                  {Array.isArray(grid.ranked_items) &&
                    grid.ranked_items.slice(0, 5).map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-racing-orange text-xs font-bold text-white flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs text-gray-900 truncate">{item.name || 'Unknown'}</span>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Link
        href={`/u/${highlightedFan.username}`}
        className="mt-4 inline-block text-sm text-bright-teal hover:text-racing-orange font-medium"
      >
        View all grids by {highlightedFan.username} →
      </Link>
    </div>
  )
}

