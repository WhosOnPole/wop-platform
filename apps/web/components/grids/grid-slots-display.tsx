'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { stripSprintSuffix } from '@/utils/grid-labels'
import { DriverCardMedia } from '@/components/drivers/driver-card-media'

interface GridItem {
  id: string
  name: string
  image_url?: string | null
  headshot_url?: string | null
  country?: string | null
  location?: string | null
  circuit_ref?: string | null
  team_name?: string | null
  is_placeholder?: boolean
}

export interface GridSlotsDisplayProps {
  grid: {
    id: string
    type: 'driver' | 'team' | 'track'
    ranked_items: Array<GridItem>
  }
  supabaseUrl?: string
  /** When false, slots are divs (for embed when whole card is a link). Default true. */
  linkItems?: boolean
}

function buildFilledItems({
  items,
  gridType,
}: {
  items: GridItem[]
  gridType: 'driver' | 'team' | 'track'
}): GridItem[] {
  return Array.from({ length: 10 }, (_, index) => {
    const existingItem = items[index]
    if (existingItem) return existingItem
    return {
      id: `__placeholder__${gridType}_${index + 1}`,
      name: '',
      is_placeholder: true,
    }
  })
}

export function GridSlotsDisplay({
  grid,
  supabaseUrl,
  linkItems = true,
}: GridSlotsDisplayProps) {
  const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
  const filledItems = buildFilledItems({ items: rankedItems, gridType: grid.type })
  const firstItem = filledItems[0]
  const otherItems = filledItems.slice(1, 10)

  const [firstTrackSvgFailed, setFirstTrackSvgFailed] = useState(false)
  const [failedTrackIds, setFailedTrackIds] = useState<Set<string>>(new Set())

  function getItemImageUrl(item: GridItem): string | null {
    if (grid.type === 'driver') {
      return item.headshot_url || item.image_url || null
    }
    if (grid.type === 'team') {
      return supabaseUrl ? getTeamBackgroundUrl(stripSprintSuffix(item.name), supabaseUrl) : null
    }
    if (grid.type === 'track') {
      return supabaseUrl ? getTrackSvgUrl(getTrackSlug(stripSprintSuffix(item.name)), supabaseUrl) : null
    }
    return null
  }

  function getDriverCode(item: GridItem): string {
    if (grid.type !== 'driver') return ''
    const name = stripSprintSuffix(item.name)
    const parts = name.split(' ')
    const lastName = parts[parts.length - 1] || name
    return lastName.substring(0, 3).toUpperCase()
  }

  function getTrackLabel(item: GridItem): string {
    if (grid.type !== 'track') return ''
    let raw = item.circuit_ref || item.location || item.name || ''
    raw = raw.toString().trim().replace(/\s*\/\s*sprint$/i, '').trim()
    return raw.toUpperCase()
  }

  function getOverlayText(item: GridItem, gridType: 'driver' | 'team' | 'track'): string {
    if (item.is_placeholder || !item.name) return ''
    if (gridType === 'driver') return getDriverCode(item)
    if (gridType === 'team') return stripSprintSuffix(item.name)
    if (gridType === 'track') return getTrackLabel(item)
    return ''
  }

  const SlotWrapper = linkItems ? Link : 'div'
  const slotLinkProps = linkItems ? { href: `/grid/${grid.id}` } : {}

  function renderSlotContent(
    item: GridItem,
    rank: number,
    isFirst: boolean,
    failedTrackIds: Set<string>
  ) {
    const slotContent = (
      <>
        {grid.type === 'driver' && (
          <div className="absolute inset-0 z-0">
            <DriverCardMedia
              driverName={stripSprintSuffix(item.name)}
              supabaseUrl={supabaseUrl}
              fallbackSrc={item.headshot_url || item.image_url}
              sizes={isFirst ? '(max-width: 868px) 50vw, 300px' : '(max-width: 768px) 28vw, 80px'}
            />
          </div>
        )}
        {(grid.type === 'track' || grid.type === 'team') && (
          <div
            className={`absolute inset-0 z-0 ${grid.type === 'team' ? 'bg-black/30' : 'bg-black/40'}`}
            aria-hidden
          />
        )}
        {grid.type === 'track' && getItemImageUrl(item) && !failedTrackIds.has(item.id) && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{
              transform: 'scale(2.2)',
              transformOrigin: isFirst ? '-10% 40%' : '-20% 40%',
              padding: isFirst ? '0.5rem' : '0.125rem',
            }}
          >
            <img
              src={getItemImageUrl(item)!}
              alt=""
              className="h-full max-h-full w-auto object-contain"
              onError={() =>
                isFirst
                  ? setFirstTrackSvgFailed(true)
                  : setFailedTrackIds((s) => new Set(s).add(item.id))
              }
              aria-hidden
            />
          </div>
        )}
        {grid.type !== 'team' && (
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        )}
        {getOverlayText(item, grid.type) &&
          (grid.type === 'team' ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-2 pointer-events-none opacity-90">
              <span
                className="font-semibold uppercase leading-none line-clamp-2 text-center text-white select-none block w-full"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: isFirst ? 'clamp(0.85rem, 2.5vw, 1.1rem)' : 'clamp(0.5rem, 2vw, 0.75rem)',
                  letterSpacing: 0,
                  lineHeight: 1,
                  textShadow:
                    '0 .5px 1px rgba(0, 0, 0, 0.8), 0 1.3px 1.6px rgba(51, 13, 73, 0.5)',
                }}
              >
                {getOverlayText(item, grid.type)}
              </span>
            </div>
          ) : isFirst ? (
            <div
              className={`absolute z-20 flex justify-center overflow-visible pointer-events-none ${
                grid.type === 'track'
                  ? 'left-1 top-1/2 h-[70%] items-center w-5 md:w-6 -translate-y-1/2'
                  : 'left-1 bottom-0 h-[100%] items-end pb-4 text-left w-5 md:w-6'
              }`}
            >
              <span
                className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none select-none tracking-widest"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: grid.type === 'track' ? 700 : 900,
                  fontSize:
                    grid.type === 'track'
                      ? 'clamp(1rem, 3vw, 1.5rem)'
                      : 'clamp(12px, 4vw, 25px)',
                  letterSpacing: '0',
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center center',
                }}
              >
                {getOverlayText(item, grid.type)}
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 z-20 flex items-end justify-center px-0.5 pb-0.5 pointer-events-none">
              <span
                className="font-bold uppercase leading-none text-center text-white select-none line-clamp-1 text-[10px] min-[400px]:text-xs"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: grid.type === 'track' ? 700 : 900,
                  textShadow:
                    '0 .5px 1px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6)',
                }}
              >
                {getOverlayText(item, grid.type)}
              </span>
            </div>
          ))}
        <div
          className={`absolute z-30 ${isFirst ? 'top-2 right-2' : 'top-0.5 right-0.5'}`}
        >
          <div
            className={
              isFirst
                ? 'text-[clamp(1.5rem,8vw,3.75rem)] font-bold text-white leading-none'
                : 'text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold text-white leading-none tabular-nums'
            }
          >
            {rank}
          </div>
        </div>
        {grid.type !== 'track' &&
          grid.type !== 'team' &&
          !getItemImageUrl(item) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-600">
                {stripSprintSuffix(item.name).charAt(0)}
              </span>
            </div>
          )}
      </>
    )
    return slotContent
  }

  return (
    <div className="flex gap-2 items-start">
      {firstItem && (
        <div className="w-1/2 min-w-0 flex-shrink-0">
          {firstItem.is_placeholder ? (
            <div className="relative block aspect-square w-full rounded-xl overflow-hidden border border-dashed border-white/20 bg-white/5">
              <div className="absolute top-2 right-2 z-30">
                <div className="text-[clamp(1.5rem,8vw,3.75rem)] font-bold text-white/30 leading-none">
                  1
                </div>
              </div>
            </div>
          ) : (
            <SlotWrapper
              {...slotLinkProps}
              className="relative block aspect-square w-full rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
              style={
                grid.type === 'driver'
                  ? undefined
                  : {
                      backgroundImage:
                        grid.type === 'track'
                          ? 'url(/images/grid_bg.png)'
                          : getItemImageUrl(firstItem)
                            ? `url(${getItemImageUrl(firstItem)})`
                            : 'url(/images/pit_bg.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: grid.type === 'team' ? 'no-repeat' : undefined,
                      backgroundColor:
                        grid.type === 'track' || getItemImageUrl(firstItem)
                          ? undefined
                          : '#f3f4f6',
                    }
              }
            >
              {renderSlotContent(
                firstItem,
                1,
                true,
                firstTrackSvgFailed ? new Set([firstItem.id]) : failedTrackIds
              )}
            </SlotWrapper>
          )}
        </div>
      )}

      <div className="w-1/2 min-w-0 grid grid-cols-3 gap-1">
        {otherItems.map((item, index) => {
          const rank = index + 2
          if (item.is_placeholder) {
            return (
              <div
                key={item.id}
                className="relative block aspect-square w-full min-w-0 rounded-lg overflow-hidden border border-dashed border-white/20 bg-white/5"
              >
                <div className="absolute top-0.5 right-0.5 z-30">
                  <div className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold text-white/30 leading-none tabular-nums">
                    {rank}
                  </div>
                </div>
              </div>
            )
          }
          return (
            <SlotWrapper
              key={item.id}
              {...slotLinkProps}
              className="relative block aspect-square w-full min-w-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              style={
                grid.type === 'driver'
                  ? undefined
                  : {
                      backgroundImage:
                        grid.type === 'track'
                          ? 'url(/images/grid_bg.png)'
                          : getItemImageUrl(item)
                            ? `url(${getItemImageUrl(item)})`
                            : 'url(/images/pit_bg.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: grid.type === 'team' ? 'no-repeat' : undefined,
                      backgroundColor:
                        grid.type === 'track' || getItemImageUrl(item)
                          ? undefined
                          : '#f3f4f6',
                    }
              }
            >
              {renderSlotContent(item, rank, false, failedTrackIds)}
            </SlotWrapper>
          )
        })}
      </div>
    </div>
  )
}
