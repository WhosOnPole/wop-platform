'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getTeamIconUrl } from '@/utils/storage-urls'
import Image from 'next/image'

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

  // Format item name (last name for drivers, full name for teams/tracks)
  function formatItemName(item: { id: string; name: string }): string {
    if (gridType === 'driver') {
      const parts = item.name.split(' ')
      return parts[parts.length - 1] || item.name
    }
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
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700">
          Updated {daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day' : `${daysAgo} days`} ago
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* 4-column grid of thin rectangular panels */}
      {isExpanded && (
        <div className="grid grid-cols-4 gap-2 p-3">
          {displayItems.map((item, index) => {
            const rank = index + 1
            const teamIconUrl = getTeamIcon(item)
            
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded border border-gray-200 bg-white px-2 py-1.5"
              >
                <span className="text-xs font-bold text-gray-600">{rank}</span>
                <span className="flex-1 truncate text-xs font-medium text-gray-900">
                  {formatItemName(item)}
                </span>
                {teamIconUrl && (
                  <Image
                    src={teamIconUrl}
                    alt={item.name}
                    width={16}
                    height={16}
                    className="object-contain brightness-0 invert"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
