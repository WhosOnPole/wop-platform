import Link from 'next/link'
import { Grid } from 'lucide-react'

interface GridItem {
  id: string
  type: string
  comment: string | null
  ranked_items: any[]
  created_at: string
}

interface UserGridsSectionProps {
  grids: GridItem[]
  username: string
}

export function UserGridsSection({ grids, username }: UserGridsSectionProps) {
  // Separate grids by type
  const driverGrids = grids.filter((g) => g.type === 'driver').slice(0, 10)
  const teamGrids = grids.filter((g) => g.type === 'team').slice(0, 10)
  const trackGrids = grids.filter((g) => g.type === 'track').slice(0, 10)

  const topThree = {
    drivers: driverGrids.slice(0, 3),
    teams: teamGrids.slice(0, 3),
    tracks: trackGrids.slice(0, 3),
  }

  const rest = {
    drivers: driverGrids.slice(3),
    teams: teamGrids.slice(3),
    tracks: trackGrids.slice(3),
  }

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center space-x-2">
        <Grid className="h-5 w-5 text-purple-500" />
        <h2 className="text-2xl font-semibold text-gray-900">
          {username}&apos;s Rankings
        </h2>
      </div>

      {/* Driver Grids */}
      {driverGrids.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Drivers</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.drivers.map((grid) => (
              <div
                key={grid.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
              >
                {grid.comment && (
                  <p className="mb-3 text-sm italic text-gray-600">&quot;{grid.comment}&quot;</p>
                )}
                <div className="space-y-2">
                  {Array.isArray(grid.ranked_items) &&
                    grid.ranked_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span>{item.name || 'Unknown'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          {rest.drivers.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {rest.drivers.map((grid) => (
                <div
                  key={grid.id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs"
                >
                  <p className="font-medium text-gray-900">
                    {grid.ranked_items?.[0]?.name || 'Unknown'} #1
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Grids */}
      {teamGrids.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Teams</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.teams.map((grid) => (
              <div
                key={grid.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
              >
                {grid.comment && (
                  <p className="mb-3 text-sm italic text-gray-600">&quot;{grid.comment}&quot;</p>
                )}
                <div className="space-y-2">
                  {Array.isArray(grid.ranked_items) &&
                    grid.ranked_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span>{item.name || 'Unknown'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          {rest.teams.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {rest.teams.map((grid) => (
                <div
                  key={grid.id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs"
                >
                  <p className="font-medium text-gray-900">
                    {grid.ranked_items?.[0]?.name || 'Unknown'} #1
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Track Grids */}
      {trackGrids.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Tracks</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {topThree.tracks.map((grid) => (
              <div
                key={grid.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
              >
                {grid.comment && (
                  <p className="mb-3 text-sm italic text-gray-600">&quot;{grid.comment}&quot;</p>
                )}
                <div className="space-y-2">
                  {Array.isArray(grid.ranked_items) &&
                    grid.ranked_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-700"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span>{item.name || 'Unknown'}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
          {rest.tracks.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
              {rest.tracks.map((grid) => (
                <div
                  key={grid.id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs"
                >
                  <p className="font-medium text-gray-900">
                    {grid.ranked_items?.[0]?.name || 'Unknown'} #1
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

