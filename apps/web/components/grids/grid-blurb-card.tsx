'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { GridHeartButton } from '@/components/profile/grid-heart-button'

interface GridBlurbCardProps {
  gridId: string
  blurb: string | null
  likeCount: number
  isLiked: boolean
  owner: { username: string; profile_image_url: string | null }
  isOwnProfile: boolean
}

export function GridBlurbCard({
  gridId,
  blurb,
  likeCount,
  isLiked,
  owner,
  isOwnProfile,
}: GridBlurbCardProps) {
  return (
    <div className="rounded-lg bg-black/86 text-white w-full max-w-[280px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 min-w-0">
          <Link href={`/u/${owner.username}`} className="flex-shrink-0">
            {owner.profile_image_url ? (
              <Image
                src={owner.profile_image_url}
                alt={owner.username}
                width={20}
                height={20}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-full bg-[#d9d9d9]/25 flex items-center justify-center text-xs font-normal">
                {owner.username.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <span className="text-white truncate font-normal text-xs">{owner.username}</span>
        </div>
        {!isOwnProfile && (
          <div className="flex-shrink-0">
            <GridHeartButton
              gridId={gridId}
              initialLikeCount={likeCount}
              initialIsLiked={isLiked}
            />
          </div>
        )}
        {isOwnProfile && (
          <div className="flex items-center gap-1.5 text-white/80 text-sm">
            <Heart className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
            <span>{likeCount}</span>
          </div>
        )}
      </div>
      {blurb && <p className="pl-8 text-xs text-white font-light leading-tight line-clamp-4">{blurb}</p>}
    </div>
  )
}
