'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getTeamIconUrl } from '@/utils/storage-urls'
import { getTeamPrimaryColor } from '@/utils/team-colors'
import { stripSprintSuffix } from '@/utils/grid-labels'

export interface FeaturedGridTilesGrid {
  id: string
  type: 'driver' | 'team' | 'track'
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
}

interface FeaturedGridTilesProps {
  grid: FeaturedGridTilesGrid
  supabaseUrl?: string
  /** When false, rows are not links (use when whole card is a link, e.g. carousel) */
  linkRows?: boolean
}

function entityHref(gridType: 'driver' | 'team' | 'track', name: string): string {
  const slug = stripSprintSuffix(name).toLowerCase().replace(/\s+/g, '-')
  return `/${gridType}s/${slug}`
}

export function getGridTypeLabel(type: 'driver' | 'team' | 'track'): string {
  if (type === 'driver') return 'Drivers'
  if (type === 'team') return 'Teams'
  return 'Tracks'
}

function getTeamIcon(
  gridType: 'driver' | 'team' | 'track',
  item: { name: string },
  supabaseUrl?: string
): string | null {
  if (gridType === 'team' && supabaseUrl) {
    return getTeamIconUrl(stripSprintSuffix(item.name), supabaseUrl)
  }
  return null
}

function getRowBorderStyle(
  gridType: 'driver' | 'team' | 'track',
  item: { name: string; team_name?: string | null }
): React.CSSProperties {
  if (gridType === 'driver' && item.team_name) {
    return { borderColor: getTeamPrimaryColor(item.team_name) }
  }
  if (gridType === 'team') {
    return { borderColor: getTeamPrimaryColor(stripSprintSuffix(item.name)) }
  }
  return {}
}

/** Top 3 as horizontal row sections (like GridSnapshot "Updated {date}") with team-colored borders */
export function FeaturedGridTiles({ grid, supabaseUrl, linkRows = true }: FeaturedGridTilesProps) {
  const topThree = (grid.ranked_items ?? []).slice(0, 3)

  const rowContent = (item: (typeof topThree)[number], rank: number) => {
    const teamIconUrl = getTeamIcon(grid.type, item, supabaseUrl)
    const borderStyle = getRowBorderStyle(grid.type, item)
    const hasTeamColor = grid.type === 'driver' && item.team_name || grid.type === 'team'
    const baseBorderClass = hasTeamColor ? 'border' : 'border border-white/20'

    const content = (
      <>
        <span className="text-xs font-semibold text-white/70 shrink-0 tabular-nums">
          {rank}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-white">
          {stripSprintSuffix(item.name)}
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
      </>
    )

    const className = `flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5 transition-colors hover:bg-white/10 ${baseBorderClass}`

    if (linkRows) {
      return (
        <Link
          key={item.id}
          href={entityHref(grid.type, item.name)}
          style={borderStyle}
          className={className}
        >
          {content}
        </Link>
      )
    }

    return (
      <div key={item.id} style={borderStyle} className={className}>
        {content}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {topThree.map((item, index) => {
        if (!item || item.is_placeholder || !item.name) return null
        return rowContent(item, index + 1)
      })}
    </div>
  )
}
