'use client'

import Link from 'next/link'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { GridDisplayCard } from '@/components/profile/grid-display-card'

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
  const gridForDisplay = {
    id: grid.id,
    type: grid.type,
    ranked_items: grid.ranked_items ?? [],
    blurb: grid.blurb ?? grid.comment ?? null,
    like_count: grid.like_count ?? 0,
    comment_count: grid.comment_count ?? 0,
    is_liked: false,
    previous_state: null,
    updated_at: grid.updated_at ?? grid.created_at ?? null,
  }

  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm ${className}`}
    >
      <div className="mb-4 flex items-center space-x-3">
        <div
          className={`h-10 w-10 shrink-0 rounded-full overflow-hidden ${
            isDefaultAvatar(user?.profile_image_url)
              ? 'bg-white border border-gray-200'
              : ''
          }`}
        >
          <img
            src={getAvatarUrl(user?.profile_image_url)}
            alt={user?.username ?? ''}
            className="h-full w-full rounded-full object-cover"
          />
        </div>
        <div>
          <Link
            href={`/u/${user?.username || 'unknown'}`}
            className="font-medium text-white/90 hover:text-white"
          >
            {user?.username || 'Unknown'}
          </Link>
        </div>
      </div>
      <GridDisplayCard
        grid={gridForDisplay}
        isOwnProfile={false}
        supabaseUrl={supabaseUrl}
      />
    </div>
  )
}
