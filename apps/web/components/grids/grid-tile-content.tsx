'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { DriverCardMedia } from '../drivers/driver-card-media'

export interface GridTileItem {
  id: string
  name: string
  is_placeholder?: boolean
  headshot_url?: string | null
  image_url?: string | null
  team_name?: string | null
  location?: string | null
  country?: string | null
  circuit_ref?: string | null
  track_slug?: string
  [key: string]: unknown
}

interface GridTileContentProps {
  type: 'driver' | 'team' | 'track'
  item: GridTileItem
  supabaseUrl?: string
  rank?: number
  size: 'large' | 'small'
  className?: string
  /** When true, render as empty placeholder (e.g. + or rank only) */
  isEmpty?: boolean
}

function getItemImageUrl(
  type: 'driver' | 'team' | 'track',
  item: GridTileItem,
  supabaseUrl?: string
): string | null {
  if (type === 'driver') return item.headshot_url || item.image_url || null
  if (type === 'team') return supabaseUrl ? getTeamBackgroundUrl(item.name, supabaseUrl) : null
  if (type === 'track') {
    const slug = item.track_slug ?? getTrackSlug(item.name)
    return supabaseUrl ? getTrackSvgUrl(slug, supabaseUrl) : null
  }
  return null
}

function getVerticalText(type: 'driver' | 'team' | 'track', item: GridTileItem): string {
  if (type === 'driver') {
    const parts = item.name.split(' ')
    const lastName = parts[parts.length - 1] || item.name
    return lastName.substring(0, 3).toUpperCase()
  }
  if (type === 'team') return ''
  return (item.circuit_ref || item.location || '').toUpperCase()
}

export function GridTileContent({
  type,
  item,
  supabaseUrl,
  rank,
  size,
  className = '',
  isEmpty = false,
}: GridTileContentProps) {
  const [trackSvgFailed, setTrackSvgFailed] = useState(false)
  const imageUrl = getItemImageUrl(type, item, supabaseUrl)
  const verticalText = getVerticalText(type, item)

  if (isEmpty || item.is_placeholder) {
    const rankLabel = rank != null ? rank : ''
    const isLarge = size === 'large'
    return (
      <div
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-white/5 ${className}`}
        style={isLarge ? { minHeight: 0 } : undefined}
      >
        {rankLabel !== '' && (
          <div className={`absolute z-30 ${isLarge ? 'top-2 right-2' : 'top-0.5 right-0.5'}`}>
            <div
              className={`font-bold text-white/30 leading-none ${isLarge ? 'text-[clamp(4rem,8vw,3.75rem)]' : 'text-[clamp(8px,2vw,10px)]'}`}
            >
              {rankLabel}
            </div>
          </div>
        )}
        <Plus className="h-8 w-8 text-white/50 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden />
      </div>
    )
  }

  const isLarge = size === 'large'
  const containerClass = isLarge ? 'rounded-xl' : 'rounded-lg'
  const rankClass = isLarge ? 'text-[clamp(4rem,8vw,3.75rem)]' : 'text-[clamp(8px,2vw,10px)]'
  const rankPos = isLarge ? 'top-2 right-2' : 'top-0.5 right-0.5'

  return (
    <div
      className={`relative block aspect-square w-full overflow-hidden ${containerClass} ${className}`}
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
              backgroundColor: type === 'track' || imageUrl ? undefined : '#f3f4f6',
            }
      }
    >
      {type === 'driver' && (
        <div className="absolute inset-0 z-0">
          <DriverCardMedia
            driverName={item.name}
            supabaseUrl={supabaseUrl}
            fallbackSrc={item.headshot_url || item.image_url}
            sizes={isLarge ? '(max-width: 768px) 50vw, 200px' : '(max-width: 768px) 28vw, 80px'}
          />
        </div>
      )}
      {(type === 'track' || type === 'team') && (
        <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
      )}
      {type === 'track' && imageUrl && !trackSvgFailed && (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center ${isLarge ? 'p-2' : 'p-0.5'}`}
          style={{ transform: 'scale(1.7)', transformOrigin: '-2% 40%' }}
        >
          <img
            src={imageUrl}
            alt=""
            className="h-full max-h-full w-auto object-contain"
            onError={() => setTrackSvgFailed(true)}
            aria-hidden
          />
        </div>
      )}
      {type === 'team' && (
        <span
          className={`absolute inset-0 z-10 flex items-center justify-center px-2 text-center text-white font-semibold uppercase leading-tight line-clamp-2 ${isLarge ? 'text-[clamp(12px,2vw,18px)]' : 'px-0.5 text-[10px]'}`}
          style={isLarge ? { fontFamily: 'Inter, sans-serif' } : { fontFamily: 'Inter, sans-serif' }}
        >
          {item.name}
        </span>
      )}
      {type !== 'team' && (
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
      {verticalText && (
        <div
          className={`absolute z-30 flex items-center justify-center overflow-visible ${isLarge ? 'h-[70%] w-5 md:w-6 mt-4 left-2 top-2' : 'h-[44px] w-3 left-0.5 top-0.5'} ${type === 'track' && !isLarge ? 'left-0.5 top-1' : ''}`}
        >
          <span
            className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
            style={{
              fontSize: isLarge ? (type === 'driver' ? 'clamp(30px, 2.5vw, 20px)' : 'clamp(25px, 1.6vw, 16px)') : type === 'driver' ? '8px' : '15px',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: type === 'track' ? '0' : '0.05em',
              transform: 'rotate(-90deg)',
              transformOrigin: type === 'driver' ? 'center center' : '90% 100%',
            }}
          >
            {verticalText}
          </span>
        </div>
      )}
      {rank != null && (
        <div className={`absolute z-30 ${rankPos}`}>
          <div className={`font-bold text-white leading-none ${rankClass}`}>{rank}</div>
        </div>
      )}
      {type !== 'track' && type !== 'team' && !imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-600">{item.name.charAt(0)}</span>
        </div>
      )}
    </div>
  )
}
