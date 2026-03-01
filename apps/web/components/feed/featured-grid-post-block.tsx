'use client'

import Link from 'next/link'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { FeaturedGridTiles, getGridTypeLabel } from './featured-grid-tiles'

export interface FeaturedGridForBlock {
  id: string
  type: 'driver' | 'team' | 'track'
  comment?: string | null
  blurb?: string | null
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
  like_count?: number
  comment_count?: number
  updated_at?: string | null
  created_at?: string | null
}

export interface FeaturedGridUser {
  id: string
  username: string
  profile_image_url: string | null
}

interface FeaturedGridPostBlockProps {
  grid: FeaturedGridForBlock
  user: FeaturedGridUser | null
  supabaseUrl?: string
  className?: string
}

export function FeaturedGridPostBlock({
  grid,
  user,
  supabaseUrl,
  className = '',
}: FeaturedGridPostBlockProps) {
  const gridForTiles = {
    id: grid.id,
    type: grid.type,
    ranked_items: grid.ranked_items ?? [],
  }

  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm ${className}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
          Featured Grid: {getGridTypeLabel(grid.type)}
        </span>
        <Link
          href={`/u/${user?.username || 'unknown'}`}
          className="font-display text-base font-bold text-white hover:text-white/90"
        >
          {user?.username || 'Unknown'}
        </Link>
      </div>
      <div className="mt-4 flex gap-6">
        {/* Left 50%: top 3 grid squares (profile-style) */}
        <div className="flex w-1/2 min-w-0 flex-col">
          <FeaturedGridTiles grid={gridForTiles} supabaseUrl={supabaseUrl} />
        </div>
        {/* Right 50%: profile circle, view grid link */}
        <div className="flex w-1/2 min-w-0 flex-col items-center justify-between">
          <div className="flex flex-col items-center">
            <div
              className={`mt-2 h-20 w-20 shrink-0 overflow-hidden rounded-full ${
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
