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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-2 shrink-0">
        <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
          Featured Grid: {getGridTypeLabel(grid.type)}
        </span>
        <h2 className="font-display text-sm font-bold text-white">
          {user?.username ?? 'Unknown'}
        </h2>
      </div>
      <div className="mt-2 flex min-h-0 flex-1 gap-4">
        {/* Left 50%: top 3 grid squares (profile-style) */}
        <div className="flex w-1/2 min-w-0 flex-col">
          <FeaturedGridTiles grid={grid} supabaseUrl={supabaseUrl} />
        </div>
        {/* Right 50%: profile circle, view grid link */}
        <div className="flex w-1/2 min-w-0 flex-col items-center justify-between">
          <div className="flex flex-col items-center">
            <div
              className={`mb-1 h-20 w-20 shrink-0 overflow-hidden rounded-full ${
                isDefaultAvatar(user?.profile_image_url) ? 'border border-gray-200 bg-white' : ''
              }`}
            >
              <img
                src={getAvatarUrl(user?.profile_image_url)}
                alt={user?.username ?? ''}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </div>
          <div className="w-full text-right">
            <Link
              href={`/grid/${grid.id}`}
              className="text-xs font-medium text-white hover:text-sunset-start"
            >
              View grid →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
