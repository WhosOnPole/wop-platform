import Link from 'next/link'
import { Grid } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

interface GridItem {
  id: string
  comment: string | null
  ranked_items: any[]
  created_at: string
  user: User | null
}

interface CommunityGridsSectionProps {
  grids: GridItem[]
  entityType: string
  entityName: string
}

export function CommunityGridsSection({
  grids,
  entityType,
  entityName,
}: CommunityGridsSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Grid className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Community {entityName} Rankings
          </h2>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-4">
          {grids.map((grid) => (
            <div
              key={grid.id}
              className="min-w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
            >
              <div className="mb-3 flex items-center space-x-2">
                <img
                  src={getAvatarUrl(grid.user?.profile_image_url)}
                  alt={grid.user?.username ?? ''}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <Link
                  href={`/u/${grid.user?.username || 'unknown'}`}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600"
                >
                  {grid.user?.username || 'Unknown'}
                </Link>
              </div>
              {grid.comment && (
                <p className="mb-3 text-sm italic text-gray-600">&quot;{grid.comment}&quot;</p>
              )}
              <div className="space-y-1">
                {Array.isArray(grid.ranked_items) &&
                  grid.ranked_items.slice(0, 5).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm text-gray-700"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="truncate">{item.name || 'Unknown'}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

