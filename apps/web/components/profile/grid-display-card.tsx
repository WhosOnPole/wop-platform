'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronRight, Plus } from 'lucide-react'
import { GridHeartButton } from './grid-heart-button'
import { CommentIcon } from '@/components/ui/comment-icon'
import { GridSnapshot } from './grid-snapshot'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { getTeamShortCode } from '@/utils/team-colors'
import { DriverCardMedia } from '../drivers/driver-card-media'

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

interface GridDisplayCardProps {
  grid: {
    id: string
    type: 'driver' | 'team' | 'track'
    ranked_items: Array<GridItem>
    blurb?: string | null
    like_count?: number
    comment_count?: number
    is_liked?: boolean
    previous_state?: Array<GridItem> | null
    updated_at?: string | null
  }
  isOwnProfile: boolean
  supabaseUrl?: string
}

function buildFilledItems({
  items,
  gridType,
}: {
  items: GridItem[]
  gridType: GridDisplayCardProps['grid']['type']
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

export function GridDisplayCard({
  grid,
  isOwnProfile,
  supabaseUrl,
}: GridDisplayCardProps) {
  const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
  const filledItems = buildFilledItems({ items: rankedItems, gridType: grid.type })
  const firstItem = filledItems[0]
  const otherItems = filledItems.slice(1, 10) // Items 2-10
  const isPlaceholderGrid = grid.id.startsWith('__placeholder__')

  const [firstTrackSvgFailed, setFirstTrackSvgFailed] = useState(false)
  const [failedTrackIds, setFailedTrackIds] = useState<Set<string>>(new Set())

  // Get image URL for an item (tracks use storage SVG; teams use background.jpg for tile bg)
  function getItemImageUrl(item: GridItem): string | null {
    if (grid.type === 'driver') {
      return item.headshot_url || item.image_url || null
    } else if (grid.type === 'team') {
      return supabaseUrl ? getTeamBackgroundUrl(item.name, supabaseUrl) : null
    } else if (grid.type === 'track') {
      return supabaseUrl ? getTrackSvgUrl(getTrackSlug(item.name), supabaseUrl) : null
    }
    return null
  }

  // Driver short code: last name first 3 letters, uppercase
  function getDriverCode(item: GridItem): string {
    if (grid.type !== 'driver') return ''
    const parts = item.name.split(' ')
    const lastName = parts[parts.length - 1] || item.name
    return lastName.substring(0, 3).toUpperCase()
  }

  // Track label: circuit_ref (e.g. MON, SPA) or location/name fallback
  function getTrackLabel(item: GridItem): string {
    if (grid.type !== 'track') return ''
    const raw = item.circuit_ref || item.location || item.name || ''
    return raw.toString().trim().toUpperCase()
  }

  // Overlay text: driver shortcode, team shortcode, or track circuit_ref name
  function getOverlayText(item: GridItem, gridType: 'driver' | 'team' | 'track'): string {
    if (item.is_placeholder || !item.name) return ''
    if (gridType === 'driver') return getDriverCode(item)
    if (gridType === 'team') return getTeamShortCode(item.name)
    if (gridType === 'track') return getTrackLabel(item)
    return ''
  }

  const commentCount = grid.comment_count ?? 0

  return (
    <div className="shadow-sm">


      {/* Empty state: same layout, gray boxes with + , clickable to edit when own profile */}
      {isPlaceholderGrid ? (
        isOwnProfile ? (
          <Link
            href={`/profile/edit-grid/${grid.type}`}
            className="block mb-4 cursor-pointer group"
            aria-label={`Add your ${grid.type} grid`}
          >
            <div className="flex gap-2 items-start">
              {/* #1 slot - large */}
              <div className="w-1/2 min-w-0 flex-shrink-0 rounded-xl border border-white/30 bg-white/10 aspect-square flex items-center justify-center group-hover:bg-white/15 transition-colors">
                <Plus className="h-12 w-12 text-white/50 md:h-16 md:w-16" strokeWidth={1.5} aria-hidden />
              </div>
              {/* Slots 2–10 - 3x3 */}
              <div className="w-1/2 min-w-0 grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square w-full min-w-0 rounded-lg border border-white/30 bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-white/50 md:h-8 md:w-8" strokeWidth={1.5} aria-hidden />
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ) : (
          <div className="mb-4 flex gap-2 items-start">
            <div className="w-1/2 min-w-0 flex-shrink-0 rounded-xl border border-white/30 bg-white/10 aspect-square flex items-center justify-center">
              <Plus className="h-12 w-12 text-white/50 md:h-16 md:w-16" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="w-1/2 min-w-0 grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square w-full min-w-0 rounded-lg border border-white/30 bg-white/10 flex items-center justify-center"
                >
                  <Plus className="h-6 w-6 text-white/50 md:h-8 md:w-8" strokeWidth={1.5} aria-hidden />
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
      /* Grid Display: #1 (50%) + Items 2-10 (3x3 grid, 50%) */
      <div className="mb-4 flex gap-2 items-start">
        {/* #1 Item - 50% width, square aspect */}
        {firstItem && (
          <div className="w-1/2 min-w-0 flex-shrink-0">
            {firstItem.is_placeholder ? (
              isOwnProfile ? (
                <Link
                  href={`/profile/edit-grid/${grid.type}`}
                  className="relative block aspect-square w-full rounded-xl overflow-hidden border border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Add pick for rank 1"
                >
                  <div className="absolute top-2 right-2 z-30">
                    <div className="text-[clamp(1.5rem,8vw,3.75rem)] font-bold text-white/30 leading-none">1</div>
                  </div>
                  <Plus className="h-12 w-12 text-white/50 md:h-16 md:w-16" strokeWidth={1.5} aria-hidden />
                </Link>
              ) : (
                <div className="relative block aspect-square w-full rounded-xl overflow-hidden border border-dashed border-white/20 bg-white/5">
                  <div className="absolute top-2 right-2 z-30">
                    <div className="text-[clamp(1.5rem,8vw,3.75rem)] font-bold text-white/30 leading-none">1</div>
                  </div>
                </div>
              )
            ) : (
              <Link
                href={`/grid/${grid.id}`}
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
                {grid.type === 'driver' && (
                  <div className="absolute inset-0 z-0">
                    <DriverCardMedia
                      driverName={firstItem.name}
                      supabaseUrl={supabaseUrl}
                      fallbackSrc={firstItem.headshot_url || firstItem.image_url}
                      sizes="(max-width: 868px) 50vw, 300px"
                    />
                  </div>
                )}
                {/* Dark overlay (tracks and teams) */}
                {(grid.type === 'track' || grid.type === 'team') && (
                  <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
                )}
                {/* Track SVG from storage: scale + bleed right (matches pitlane track cards) */}
                {grid.type === 'track' && getItemImageUrl(firstItem) && !firstTrackSvgFailed && (
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center p-2"
                    style={{ transform: 'scale(2.2)', transformOrigin: '-10% 40%' }}
                  >
                    <img
                      src={getItemImageUrl(firstItem)!}
                      alt=""
                      className="h-full max-h-full w-auto object-contain"
                      onError={() => setFirstTrackSvgFailed(true)}
                      aria-hidden
                    />
                  </div>
                )}
                {/* Overlay gradient for text readability (drivers/tracks) */}
                {grid.type !== 'team' && (
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
                {/* Overlay: vertical for driver/track (shortcode / circuit_ref), centered horizontal for team */}
                {getOverlayText(firstItem, grid.type) && (
                  grid.type === 'team' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center px-2 pointer-events-none">
                      <span
                        className="font-sans font-black text-white select-none block w-full text-center leading-none"
                        style={{
                          letterSpacing: 0,
                          fontSize: 'clamp(1.25rem, 8vw, 3rem)',
                          lineHeight: 1,
                        }}
                      >
                        {getOverlayText(firstItem, grid.type)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`absolute z-20 flex items-center justify-center overflow-visible pointer-events-none ${
                        grid.type === 'track'
                          ? 'left-1 top-1/2 h-[70%] w-5 md:w-6 -translate-y-1/2'
                          : 'left-1 bottom-0 h-[100%] w-5 md:w-6'
                      }`}
                    >
                      <span
                        className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none select-none"
                        style={{
                          fontSize: grid.type === 'track' ? 'clamp(1rem, 3vw, 1.75rem)' : 'clamp(1rem, 2.5vw, 1.75rem)',
                          letterSpacing: grid.type === 'track' ? 0 : '0.05em',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'center center',
                        }}
                      >
                        {getOverlayText(firstItem, grid.type)}
                      </span>
                    </div>
                  )
                )}
                {/* Rating/Rank number on top right */}
                <div className="absolute top-2 right-2 z-30">
                  <div className="text-[clamp(1.5rem,8vw,3.75rem)] font-bold text-white leading-none">1</div>
                </div>

                {/* Fallback if no image (non-tracks, non-teams) */}
                {grid.type !== 'track' && grid.type !== 'team' && !getItemImageUrl(firstItem) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-600">
                      {firstItem.name.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>
            )}
          </div>
        )}

        {/* Items 2-10 - 3x3 grid, 50% width, square cells */}
        <div className="w-1/2 min-w-0 grid grid-cols-3 gap-1">
          {otherItems.map((item, index) => {
            const rank = index + 2
            if (item.is_placeholder)
              return isOwnProfile ? (
                <Link
                  key={item.id}
                  href={`/profile/edit-grid/${grid.type}`}
                  className="relative block aspect-square w-full min-w-0 rounded-lg overflow-hidden border border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label={`Add pick for rank ${rank}`}
                >
                  <div className="absolute top-0.5 right-0.5 z-30">
                    <div className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold text-white/30 leading-none tabular-nums">{rank}</div>
                  </div>
                  <Plus className="h-6 w-6 text-white/50 md:h-8 md:w-8" strokeWidth={1.5} aria-hidden />
                </Link>
              ) : (
                <div
                  key={item.id}
                  className="relative block aspect-square w-full min-w-0 rounded-lg overflow-hidden border border-dashed border-white/20 bg-white/5"
                >
                  <div className="absolute top-0.5 right-0.5 z-30">
                    <div className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold text-white/30 leading-none tabular-nums">{rank}</div>
                  </div>
                </div>
              )

            return (
              <Link
                key={item.id}
                href={`/grid/${grid.id}`}
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
                {grid.type === 'driver' && (
                  <div className="absolute inset-0 z-0">
                    <DriverCardMedia
                      driverName={item.name}
                      supabaseUrl={supabaseUrl}
                      fallbackSrc={item.headshot_url || item.image_url}
                      sizes="(max-width: 768px) 28vw, 80px"
                    />
                  </div>
                )}
                {/* Dark overlay (tracks and teams); team uses bg-black/30 to match pitlane */}
                {grid.type === 'track' && (
                  <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
                )}
                {grid.type === 'team' && (
                  <div className="absolute inset-0 z-0 bg-black/30" aria-hidden />
                )}
                {/* Track SVG from storage: scale + bleed right (matches pitlane track cards) */}
                {grid.type === 'track' && getItemImageUrl(item) && !failedTrackIds.has(item.id) && (
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center p-0.5"
                    style={{ transform: 'scale(2.2)', transformOrigin: '-20% 40%' }}
                  >
                    <img
                      src={getItemImageUrl(item)!}
                      alt=""
                      className="h-full max-h-full w-auto object-contain"
                      onError={() => setFailedTrackIds((s) => new Set(s).add(item.id))}
                      aria-hidden
                    />
                  </div>
                )}
                {/* Overlay gradient for text readability (drivers/tracks) */}
                {grid.type !== 'team' && (
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
                {/* Overlay: vertical for driver/track, centered horizontal for team (small tiles) */}
                {getOverlayText(item, grid.type) && (
                  grid.type === 'team' ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center px-0.5 pointer-events-none">
                      <span
                        className="font-sans font-black text-white select-none block w-full text-center leading-none"
                        style={{
                          letterSpacing: 0,
                          fontSize: 'clamp(0.55rem, 3.5vw, 0.95rem)',
                          lineHeight: 1,
                        }}
                      >
                        {getOverlayText(item, grid.type)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`absolute z-20 flex items-center justify-center overflow-visible pointer-events-none ${
                        grid.type === 'track'
                          ? 'left-0.5 top-1/2 h-full w-[12px] -translate-y-1/2'
                          : 'left-0.5 top-0.5 h-[44px] w-3'
                      }`}
                    >
                      <span
                        className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none select-none"
                        style={{
                          fontSize: grid.type === 'track' ? 'clamp(0.4rem, 2vw, 0.7rem)' : 'clamp(0.45rem, 2.5vw, 0.75rem)',
                          letterSpacing: grid.type === 'track' ? 0 : '0.05em',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'center center',
                        }}
                      >
                        {getOverlayText(item, grid.type)}
                      </span>
                    </div>
                  )
                )}
                {/* Rating/Rank number on top right */}
                <div className="absolute top-0.5 right-0.5 z-30">
                  <div className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold text-white leading-none tabular-nums">{rank}</div>
                </div>

              </Link>
            )
          })}
        </div>
      </div>
      )}

      {/* Actions: Like, Comment, View More - same order and size as feed posts */}
      {!isPlaceholderGrid && (
        <div className="flex items-center gap-4 w-full">
        {/* Like Heart - first to match feed post cards */}
        {!isOwnProfile ? (
          <GridHeartButton
            gridId={grid.id}
            initialLikeCount={grid.like_count || 0}
            initialIsLiked={grid.is_liked || false}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <Heart className="h-5 w-5" />
            <span className="text-sm">{grid.like_count || 0}</span>
          </div>
        )}

        {/* Comment - same destination as View Grid; always show count (0 if none) */}
        <Link
          href={`/grid/${grid.id}`}
          className="inline-flex items-center gap-1.5 text-sm leading-none text-white hover:text-white/90 transition-colors"
        >
          <CommentIcon className="h-5 w-5 shrink-0" />
          <span className="font-medium leading-none tabular-nums">{commentCount}</span>
        </Link>

        <Link
          href={`/grid/${grid.id}`}
          className="flex items-center gap-1 text-sm hover:text-sunset-start float-right justify-end ml-auto self-end"
        >
          View Grid <ChevronRight className="h-4 w-4" />
        </Link>
        </div>
      )}

      {/* Grid Snapshot (if history exists) */}
      {!isPlaceholderGrid && grid.previous_state && grid.updated_at && (
        <div className="mt-4">
          <GridSnapshot
            previousState={grid.previous_state}
            updatedAt={grid.updated_at}
            gridType={grid.type}
            supabaseUrl={supabaseUrl}
          />
        </div>
      )}
    </div>
  )
}
