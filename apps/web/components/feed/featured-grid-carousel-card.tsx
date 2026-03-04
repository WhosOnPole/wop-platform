'use client'

import Link from 'next/link'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { FeaturedGridTiles, getGridTypeLabel } from './featured-grid-tiles'
export interface FeaturedGridCarouselGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  ranked_items: Array<{
    id: string
    name: string
    headshot_url?: string | null
    image_url?: string | null
    location?: string | null
    country?: string | null
    circuit_ref?: string | null
    is_placeholder?: boolean
    team_name?: string | null
  }>
}

export interface FeaturedGridCarouselUser {
  id: string
  username: string
  profile_image_url: string | null
}

interface FeaturedGridCarouselCardProps {
  grid: FeaturedGridCarouselGrid
  user: FeaturedGridCarouselUser | null
  supabaseUrl?: string
}

export function FeaturedGridCarouselCard({
  grid,
  user,
  supabaseUrl,
}: FeaturedGridCarouselCardProps) {
  return (
    <Link
      href={`/grid/${grid.id}`}
      className="flex h-full min-h-0 flex-col transition-opacity hover:opacity-90"
    >
      <div className="flex items-baseline justify-between gap-2 shrink-0">
        <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
          Featured Grid: {getGridTypeLabel(grid.type)}
        </span>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 gap-2">
        {/* Left 50%: profile pic + name */}
        <div className="flex w-1/2 min-w-0 flex-col items-center">
          <div
            className={`mb-1 h-20 w-20 shrink-0 overflow-hidden rounded-full ${
              isDefaultAvatar(user?.profile_image_url) ? 'border border-white/20 bg-white/10' : ''
            }`}
          >
            <img
              src={getAvatarUrl(user?.profile_image_url)}
              alt={user?.username ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <h2 className="mt-2 font-display text-sm font-bold text-white">
            {user?.username ?? 'Unknown'}
          </h2>
        </div>
        {/* Right 50%: top 3 horizontal sections */}
        <div className="flex w-1/2 min-w-0 flex-col">
          <FeaturedGridTiles grid={grid} supabaseUrl={supabaseUrl} linkRows={false} />
        </div>
      </div>
    </Link>
  )
}
