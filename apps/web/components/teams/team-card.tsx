'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface TeamCardProps {
  team: { id: string; name: string; overview_text: string | null }
  slug: string
  iconUrl: string | null
}

export function TeamCard({ team, slug, iconUrl }: TeamCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Link
      href={`/teams/${slug}`}
      className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow transition-all hover:shadow-lg hover:scale-105"
    >
      {/* Team Icon */}
      <div className="relative h-64 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        {iconUrl && !imageError ? (
          <Image
            src={iconUrl}
            alt={team.name}
            width={120}
            height={120}
            className="object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-gray-400">
              {team.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Team Info */}
      <div className="p-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {team.name}
        </h3>
        
        {team.overview_text && (
          <p className="line-clamp-2 text-sm text-gray-600">
            {team.overview_text}
          </p>
        )}
      </div>
    </Link>
  )
}

