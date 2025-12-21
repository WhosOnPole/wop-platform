'use client'

import { useState } from 'react'
import { getTeamLogoUrl } from '@/utils/storage-urls'

interface TeamLogoSectionProps {
  team: { name: string }
  supabaseUrl: string
}

export function TeamLogoSection({ team, supabaseUrl }: TeamLogoSectionProps) {
  const [imageError, setImageError] = useState(false)
  const logoUrl = supabaseUrl ? getTeamLogoUrl(team.name, supabaseUrl) : null

  return (
    <div className="relative h-64 w-full md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      {logoUrl && !imageError ? (
        <img
          src={logoUrl}
          alt={`${team.name} logo`}
          className="h-full w-full object-contain p-8"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-6xl font-bold text-gray-400">
          {team.name.charAt(0)}
        </span>
      )}
    </div>
  )
}

