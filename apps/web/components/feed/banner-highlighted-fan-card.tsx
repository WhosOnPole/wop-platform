'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'

interface HighlightedFan {
  id: string
  username: string
  profile_image_url: string | null
}

interface BannerHighlightedFanCardProps {
  fan: HighlightedFan
}

export function BannerHighlightedFanCard({ fan }: BannerHighlightedFanCardProps) {
  return (
    <Link
      href={`/u/${fan.username}`}
      className="flex h-full min-h-[140px] w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm transition-colors hover:bg-white/5"
    >
      <div
        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full ${
          isDefaultAvatar(fan.profile_image_url) ? 'bg-white p-0.5' : 'bg-white/10'
        }`}
      >
        <Image
          src={getAvatarUrl(fan.profile_image_url)}
          alt={fan.username}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-white/90">
        <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span>Highlighted Fan</span>
      </div>
      <p className="mt-0.5 font-semibold text-white">@{fan.username}</p>
    </Link>
  )
}
