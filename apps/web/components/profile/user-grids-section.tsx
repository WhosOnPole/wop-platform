import Link from 'next/link'
import { Grid, Edit2 } from 'lucide-react'
import { GridHeartButton } from './grid-heart-button'

interface GridItem {
  id: string
  type: string
  blurb: string | null
  ranked_items: any[]
  created_at: string
  like_count?: number
  is_liked?: boolean
}

interface UserGridsSectionProps {
  grids: GridItem[]
  username: string
  isOwnProfile?: boolean
  currentUserId?: string
}

export function UserGridsSection({
  grids,
  username,
  isOwnProfile = false,
  currentUserId,
}: UserGridsSectionProps) {
  // Get one grid per type (most recent)
  const driverGrid = grids.find((g) => g.type === 'driver')
  const teamGrid = grids.find((g) => g.type === 'team')
  const trackGrid = grids.find((g) => g.type === 'track')

  function renderGrid(grid: GridItem | undefined, type: 'driver' | 'team' | 'track') {
    if (!grid) return null

    const maxItems = type === 'team' ? 5 : 10
    const typeLabel = type === 'driver' ? 'Drivers' : type === 'team' ? 'Teams' : 'Tracks'
    const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []

    return (
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Top {typeLabel}</h3>
          <div className="flex items-center space-x-2">
            {isOwnProfile && (
              <Link
                href={`/profile/edit-grid/${type}`}
                className="flex items-center space-x-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </Link>
            )}
            {!isOwnProfile && (
              <GridHeartButton
                gridId={grid.id}
                initialLikeCount={grid.like_count || 0}
                initialIsLiked={grid.is_liked || false}
              />
            )}
          </div>
        </div>

        {grid.blurb && (
          <p className="mb-4 text-sm italic text-gray-600">&quot;{grid.blurb}&quot;</p>
        )}

        <div className="space-y-2">
          {rankedItems.slice(0, maxItems).map((item: any, index: number) => (
            <div
              key={index}
              className="flex items-center space-x-3 rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              {item.image_url || item.headshot_url ? (
                <img
                  src={type === 'driver' ? item.headshot_url || item.image_url : item.image_url}
                  alt={item.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200">
                  <span className="text-xs font-medium text-gray-600">
                    {item.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <span className="flex-1 font-medium text-gray-900">{item.name || 'Unknown'}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hasAnyGrid = driverGrid || teamGrid || trackGrid

  if (!hasAnyGrid) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center space-x-2">
        <Grid className="h-5 w-5 text-purple-500" />
        <h2 className="text-2xl font-semibold text-gray-900">
          {username}&apos;s Rankings
        </h2>
      </div>

      {renderGrid(driverGrid, 'driver')}
      {renderGrid(teamGrid, 'team')}
      {renderGrid(trackGrid, 'track')}
    </section>
  )
}

