'use client'

import Link from 'next/link'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { FeaturedGridTiles, getGridTypeLabel } from './featured-grid-tiles'
import { GridSlotsDisplay } from '@/components/grids/grid-slots-display'
import { GridHeartButton } from '@/components/profile/grid-heart-button'

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
  is_liked?: boolean
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
  /** 'carousel' = feed sidebar, matches spotlight carousel style; 'spotlight' = Spotlight Our Picks, different look */
  variant?: 'carousel' | 'spotlight'
}

export function FeaturedGridPostBlock({
  grid,
  user,
  supabaseUrl,
  className = '',
  variant = 'spotlight',
}: FeaturedGridPostBlockProps) {
  const gridForTiles = {
    id: grid.id,
    type: grid.type,
    ranked_items: grid.ranked_items ?? [],
  }

  const gradientBorderStyle = {
    background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)',
  }

  const isCarousel = variant === 'carousel'

  const innerContent = (
    <>
      {isCarousel && (
        <div className="flex shrink-0 items-baseline justify-between gap-2">
          <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
            Featured Grid: {getGridTypeLabel(grid.type)}
          </span>
        </div>
      )}
      <div className={`flex gap-6 ${isCarousel ? 'mt-2' : 'mt-4'}`}>
        {/* Left 50%: profile pic + name */}
        <div className="flex w-1/2 min-w-0 flex-col items-center">
          <div
            className={`h-20 w-20 shrink-0 overflow-hidden rounded-full ${
              isCarousel ? 'mb-1' : 'mt-2'
            } ${
              isDefaultAvatar(user?.profile_image_url) ? 'border border-white/20 bg-white/10' : ''
            }`}
          >
            <img
              src={getAvatarUrl(user?.profile_image_url)}
              alt={user?.username ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          {isCarousel ? (
            <h2 className="mt-2 font-display text-sm font-bold text-white">
              {user?.username ?? 'Unknown'}
            </h2>
          ) : (
            <Link
              href={`/u/${user?.username || 'unknown'}`}
              className="mt-2 font-display text-base font-bold text-white hover:text-white/90"
            >
              {user?.username ?? 'Unknown'}
            </Link>
          )}
        </div>
        {/* Right 50%: top 3 horizontal sections + View grid (spotlight only) */}
        <div className="flex w-1/2 min-w-0 flex-col justify-between">
          <FeaturedGridTiles
            grid={gridForTiles}
            supabaseUrl={supabaseUrl}
            linkRows={isCarousel ? false : undefined}
          />
          {!isCarousel && (
            <div className="w-full text-right">
              <Link
                href={`/grid/${grid.id}`}
                className="text-xs font-medium text-white hover:text-sunset-start mt-6"
              >
                View grid →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (isCarousel) {
    return (
      <div className={`rounded-lg p-[2px] ${className}`} style={gradientBorderStyle}>
        <Link
          href={`/grid/${grid.id}`}
          className="flex h-full min-h-0 flex-col overflow-hidden rounded-[6px] bg-black px-4 py-2 transition-opacity hover:opacity-90"
        >
          {innerContent}
        </Link>
      </div>
    )
  }

  // Spotlight variant: Left 60% grid 1-10, Right 40% profile pic + name
  return (
    <Link
      href={`/grid/${grid.id}`}
      className={`relative block rounded-lg border border-white/20 bg-black/90 p-4 transition-opacity hover:opacity-95 ${className}`}
    >
      <div
        className="absolute top-0 right-0 z-10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <GridHeartButton
          gridId={grid.id}
          initialLikeCount={grid.like_count ?? 0}
          initialIsLiked={grid.is_liked ?? false}
          variant="dark"
        />
      </div>
      <div className="flex gap-4">
        {/* Left 60%: Grid 1-10 like profile tabbed view */}
        <div className="w-[60%] min-w-0 shrink-0">
          <GridSlotsDisplay
            grid={gridForTiles}
            supabaseUrl={supabaseUrl}
            linkItems={false}
          />
        </div>
        {/* Right 40%: profile pic + name centered */}
        <div className="flex w-[40%] min-w-0 flex-col items-center justify-center">
          <div
            className={`h-20 w-20 shrink-0 overflow-hidden rounded-full ${
              isDefaultAvatar(user?.profile_image_url) ? 'border border-white/20 bg-white/10' : ''
            }`}
          >
            <img
              src={getAvatarUrl(user?.profile_image_url)}
              alt={user?.username ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
          <h2 className="mt-2 font-display text-base font-bold text-white text-center">
            {user?.username ?? 'Unknown'}
          </h2>
        </div>
      </div>
    </Link>
  )
}
