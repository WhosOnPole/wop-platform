'use client'

import Link from 'next/link'
import { DriverCardMedia } from '@/components/drivers/driver-card-media'
import {
  getTeamBackgroundUrl,
  getTrackSlug,
  getTrackSvgUrl,
} from '@/utils/storage-urls'

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
  }>
}

interface FeaturedGridTilesProps {
  grid: FeaturedGridTilesGrid
  supabaseUrl?: string
}

function getItemImageUrl(
  type: 'driver' | 'team' | 'track',
  item: { name: string; headshot_url?: string | null; image_url?: string | null },
  supabaseUrl?: string
): string | null {
  if (type === 'driver') return item.headshot_url || item.image_url || null
  if (type === 'team') return supabaseUrl ? getTeamBackgroundUrl(item.name, supabaseUrl) : null
  if (type === 'track') {
    const slug = getTrackSlug(item.name)
    return supabaseUrl ? getTrackSvgUrl(slug, supabaseUrl) : null
  }
  return null
}

function getDriverCode(name: string): string {
  const parts = name.split(' ')
  const lastName = parts[parts.length - 1] || name
  return lastName.substring(0, 3).toUpperCase()
}

function getTrackLabel(item: {
  circuit_ref?: string | null
  location?: string | null
  name?: string
}): string {
  let raw = item.circuit_ref || item.location || item.name || ''
  raw = raw.toString().trim().replace(/\s*\/\s*sprint$/i, '').trim()
  return raw.toUpperCase()
}

export function getGridTypeLabel(type: 'driver' | 'team' | 'track'): string {
  if (type === 'driver') return 'Drivers'
  if (type === 'team') return 'Teams'
  return 'Tracks'
}

function getOverlayText(
  item: { name?: string; circuit_ref?: string | null; location?: string | null; is_placeholder?: boolean },
  gridType: 'driver' | 'team' | 'track'
): string {
  if (item.is_placeholder || !item.name) return ''
  if (gridType === 'driver') return getDriverCode(item.name)
  if (gridType === 'team') return item.name
  if (gridType === 'track') return getTrackLabel(item)
  return ''
}

function GridTile({
  item,
  rank,
  gridId,
  type,
  supabaseUrl,
  size,
}: {
  item: { id: string; name: string; headshot_url?: string | null; image_url?: string | null; location?: string | null; country?: string | null; circuit_ref?: string | null; is_placeholder?: boolean }
  rank: number
  gridId: string
  type: 'driver' | 'team' | 'track'
  supabaseUrl?: string
  size: 'large' | 'small'
}) {
  const imageUrl = getItemImageUrl(type, item, supabaseUrl)
  const driverCode = type === 'driver' ? getDriverCode(item.name) : ''
  const overlayText = getOverlayText(item, type)

  if (!item || item.is_placeholder) {
    return (
      <div
        className={`w-full min-w-0 rounded-lg border border-dashed border-white/20 bg-white/5 ${
          size === 'large' ? 'aspect-square' : 'aspect-square'
        }`}
      />
    )
  }

  return (
    <Link
      href={`/grid/${gridId}`}
      className="relative block h-full w-full min-w-0 min-h-0 overflow-hidden rounded-lg transition-opacity hover:opacity-90"
      style={
        type === 'driver'
          ? undefined
          : {
              backgroundImage:
                type === 'track'
                  ? 'url(/images/grid_bg.png)'
                  : imageUrl
                    ? `url(${imageUrl})`
                    : 'url(/images/pit_bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: type === 'team' ? 'no-repeat' : undefined,
              backgroundColor: type === 'track' || imageUrl ? undefined : '#1f2937',
            }
      }
    >
      {type === 'driver' && (
        <div className="absolute inset-0 z-0">
          <DriverCardMedia
            driverName={item.name}
            supabaseUrl={supabaseUrl}
            fallbackSrc={item.headshot_url || item.image_url}
            sizes={size === 'large' ? '(max-width: 768px) 40vw, 120px' : '(max-width: 768px) 20vw, 60px'}
          />
        </div>
      )}
      {type === 'track' && <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />}
      {type === 'team' && <div className="absolute inset-0 z-0 bg-black/30" aria-hidden />}
      {type === 'track' && imageUrl && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden p-0.5"
          style={{ transform: 'scale(2.2)', transformOrigin: '-20% 40%' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-contain" aria-hidden />
        </div>
      )}
      {type !== 'team' && (
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
      )}
      <div className="absolute top-0 right-0.5 z-30">
        <span className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold leading-none tabular-nums text-white">
          {rank}
        </span>
      </div>
      {type === 'driver' && driverCode && (
        <div className={`absolute left-0.5 z-20 flex h-[44px] w-3 items-center justify-center overflow-visible pointer-events-none ${size === 'large' ? 'bottom-2' : 'bottom-0'}`}>
          <span
            className="whitespace-nowrap font-bold uppercase leading-none select-none tracking-widest text-white"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(0.4rem, 2vw, 0.6rem)',
              letterSpacing: '0',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center center',
            }}
          >
            {driverCode}
          </span>
        </div>
      )}
      {type === 'team' && overlayText && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-2 pointer-events-none opacity-90">
          <span className="font-semibold uppercase leading-none line-clamp-2 text-center text-white select-none block w-full text-[clamp(0.4rem,2vw,0.6rem)]">
            {overlayText}
          </span>
        </div>
      )}
      {type === 'track' && overlayText && (
        <div className={`absolute left-0.5 z-20 flex h-[44px] w-3 items-center justify-center overflow-visible pointer-events-none ${size === 'large' ? 'bottom-3' : 'bottom-0'}`}>
          <span
            className="whitespace-nowrap font-bold uppercase leading-none select-none tracking-widest text-white"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(0.4rem, 2vw, 0.6rem)',
              letterSpacing: '0',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center center',
            }}
          >
            {overlayText}
          </span>
        </div>
      )}
    </Link>
  )
}

/** Top 3 grid squares in profile-style layout: #1 large (60%), #2 and #3 stacked (40%) */
export function FeaturedGridTiles({ grid, supabaseUrl }: FeaturedGridTilesProps) {
  const topThree = (grid.ranked_items ?? []).slice(0, 3)
  const [first, second, third] = topThree

  return (
    <div className="flex h-full min-h-0 gap-1.5 sm:gap-2">
      {/* #1 - 50% width, square */}
      <div className="flex w-[50%] min-w-0 flex-shrink-0 flex-col self-start overflow-hidden [aspect-ratio:1]">
        {first && (
          <GridTile
            item={first}
            rank={1}
            gridId={grid.id}
            type={grid.type}
            supabaseUrl={supabaseUrl}
            size="large"
          />
        )}
      </div>
      {/* #2 and #3 - 50% width, stacked */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2 overflow-hidden px-4">
        {second && (
          <div className="flex flex-1 min-h-0 items-start overflow-hidden">
            <GridTile
              item={second}
              rank={2}
              gridId={grid.id}
              type={grid.type}
              supabaseUrl={supabaseUrl}
              size="small"
            />
          </div>
        )}
        {third && (
          <div className="flex flex-1 min-h-0 items-start overflow-hidden">
            <GridTile
              item={third}
              rank={3}
              gridId={grid.id}
              type={grid.type}
              supabaseUrl={supabaseUrl}
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  )
}
