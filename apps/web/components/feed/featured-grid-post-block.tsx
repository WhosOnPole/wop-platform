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
    team_name?: string | null
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

  const gradientBorderStyle = {
    background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)',
  }

  return (
    <div className={`rounded-lg p-[2px] ${className}`} style={gradientBorderStyle}>
      <div
        className="rounded-[6px] bg-black p-6 shadow backdrop-blur-sm"
      >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
          Featured Grid: {getGridTypeLabel(grid.type)}
        </span>
      </div>
      <div className="mt-4 flex gap-6">
        {/* Left 50%: profile pic + name */}
        <div className="flex w-1/2 min-w-0 flex-col items-center">
          <div
            className={`mt-2 h-20 w-20 shrink-0 overflow-hidden rounded-full ${
              isDefaultAvatar(user?.profile_image_url) ? 'border border-white/20 bg-white/10' : ''
            }`}
          >
            <img
              src={getAvatarUrl(user?.profile_image_url)}
              alt={user?.username ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <Link
            href={`/u/${user?.username || 'unknown'}`}
            className="mt-2 font-display text-base font-bold text-white hover:text-white/90"
          >
            {user?.username || 'Unknown'}
          </Link>
        </div>
        {/* Right 50%: top 3 horizontal sections + View grid */}
        <div className="flex w-1/2 min-w-0 flex-col justify-between">
          <FeaturedGridTiles grid={gridForTiles} supabaseUrl={supabaseUrl} />
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
    </div>
  )
}
