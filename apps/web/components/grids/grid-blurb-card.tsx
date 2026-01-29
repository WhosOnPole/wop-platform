'use client'

import Image from 'next/image'
import Link from 'next/link'
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
    <div className="rounded-lg bg-black/86 p-4 text-white w-full max-w-[280px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/u/${owner.username}`} className="flex-shrink-0">
            {owner.profile_image_url ? (
              <Image
                src={owner.profile_image_url}
                alt={owner.username}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#d9d9d9]/25 flex items-center justify-center text-sm font-semibold">
                {owner.username.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <span className="font-medium text-white truncate">{owner.username}</span>
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
          <div className="flex items-center gap-1 text-white/80 text-sm">
            <span>{likeCount}</span>
          </div>
        )}
      </div>
      {blurb && <p className="mt-2 text-sm text-white/90 line-clamp-4">{blurb}</p>}
    </div>
  )
}
