import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { getViewGridLabel } from '@/utils/grid-labels'

interface FeaturedGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment: string | null
  ranked_items: Array<{ id?: string; name?: string; title?: string }>
  user: { id: string; username: string; profile_image_url: string | null } | null
}

interface BannerFeaturedGridCardProps {
  grid: FeaturedGrid
}

const typeLabel: Record<string, string> = {
  driver: 'Drivers',
  team: 'Teams',
  track: 'Tracks',
}

export function BannerFeaturedGridCard({ grid }: BannerFeaturedGridCardProps) {
  const label = typeLabel[grid.type] ?? grid.type
  const topItem = Array.isArray(grid.ranked_items) ? grid.ranked_items[0] : null

  return (
    <Link
      href={`/grid/${grid.id}`}
      className="flex h-full min-h-[140px] w-full flex-col rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span>Featured Grid</span>
      </div>
      <p className="mt-1 text-xs text-white/80">{label}</p>
      {grid.user && (
        <p className="mt-0.5 text-sm font-medium text-white">@{grid.user.username}</p>
      )}
      {topItem && (
        <p className="mt-2 line-clamp-2 text-xs text-white/70">
          #1 {topItem.name ?? topItem.title ?? '—'}
        </p>
      )}
      <span className="mt-auto pt-2 text-xs text-[#25B4B1]">{getViewGridLabel(grid.type)} →</span>
    </Link>
  )
}
