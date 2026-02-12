'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getTeamIconUrl } from '@/utils/storage-urls'
import Image from 'next/image'

function entityHref(gridType: 'driver' | 'team' | 'track', name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  return `/${gridType}s/${slug}`
}

interface GridSnapshotProps {
  previousState: Array<{ id: string; name: string }>
  updatedAt: string
  gridType: 'driver' | 'team' | 'track'
  supabaseUrl?: string
}

export function GridSnapshot({
  previousState,
  updatedAt,
  gridType,
  supabaseUrl,
}: GridSnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate days ago
  const daysAgo = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Use full name for all grid types
  function formatItemName(item: { id: string; name: string }): string {
    return item.name
  }

  // Get team icon URL if available
  function getTeamIcon(item: { id: string; name: string }): string | null {
    if (gridType === 'team' && supabaseUrl) {
      return getTeamIconUrl(item.name, supabaseUrl)
    }
    return null
  }

  // Show first 4 items in collapsed state, all in expanded
  const displayItems = isExpanded ? previousState : previousState.slice(0, 4)

  return (
    <div className="mt-10 rounded-lg border border-white/20 bg-white/10">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-t-lg transition-colors"
      >
        <span>
          Updated {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-white/60" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/60" />
        )}
      </button>

      {/* 2-column grid */}
      {isExpanded && (
        <div className="grid grid-cols-2 gap-1.5 px-2 py-2">
          {displayItems.map((item, index) => {
            const rank = index + 1
            const teamIconUrl = getTeamIcon(item)

            return (
              <Link
                key={item.id}
                href={entityHref(gridType, item.name)}
                className="flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-2 py-1 hover:bg-white/10 transition-colors"
              >
                <span className="text-xs font-semibold text-white/70 shrink-0">{rank}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-white">
                  {formatItemName(item)}
                </span>
                {teamIconUrl && (
                  <Image
                    src={teamIconUrl}
                    alt={item.name}
                    width={14}
                    height={14}
                    className="object-contain shrink-0 brightness-0 invert opacity-80"
                  />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
