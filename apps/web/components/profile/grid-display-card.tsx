'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronRight, Plus } from 'lucide-react'
import { GridHeartButton } from './grid-heart-button'
import { CommentIcon } from '@/components/ui/comment-icon'
import { GridSnapshot } from './grid-snapshot'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
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

  // Driver short code for vertical text near top left (drivers only)
  function getDriverCode(item: GridItem): string {
    if (grid.type !== 'driver') return ''
    const parts = item.name.split(' ')
    const lastName = parts[parts.length - 1] || item.name
    return lastName.substring(0, 3).toUpperCase()
  }

  // Track display name (tracks only) - full text, no truncation
  function getTrackDisplayText(item: GridItem): string {
    if (grid.type !== 'track') return ''
    return (item.location || item.circuit_ref || item.name || '').toUpperCase()
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
                    <div className="text-[clamp(4rem,8vw,3.75rem)] font-bold text-white/30 leading-none">1</div>
                  </div>
                  <Plus className="h-12 w-12 text-white/50 md:h-16 md:w-16" strokeWidth={1.5} aria-hidden />
                </Link>
              ) : (
                <div className="relative block aspect-square w-full rounded-xl overflow-hidden border border-dashed border-white/20 bg-white/5">
                  <div className="absolute top-2 right-2 z-30">
                    <div className="text-[clamp(4rem,8vw,3.75rem)] font-bold text-white/30 leading-none">1</div>
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
                      sizes="(max-width: 768px) 50vw, 200px"
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
                    style={{ transform: 'scale(1.7)', transformOrigin: '-2% 40%' }}
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
                {/* Team: centered uppercase Inter text overlay */}
                {grid.type === 'team' && (
                  <span
                    className="absolute inset-0 z-10 flex items-center justify-center px-3 text-center text-white font-semibold uppercase leading-tight line-clamp-2"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 'clamp(16px, 2.5vw, 24px)',
                    }}
                  >
                    {firstItem.name}
                  </span>
                )}
                {/* Track: vertical text on left edge, centered at half height */}
                {grid.type === 'track' && getTrackDisplayText(firstItem) && (
                  <div className="absolute left-1 top-1/2 z-10 flex h-[70%] w-5 md:w-6 -translate-y-1/2 items-center justify-center overflow-hidden">
                    <span
                      className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 'clamp(14px, 1.5vw, 22px)',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center center',
                      }}
                    >
                      {getTrackDisplayText(firstItem)}
                    </span>
                  </div>
                )}
                {/* Overlay gradient for text readability (drivers/tracks) */}
                {grid.type !== 'team' && (
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
                {/* Driver short code: vertical text near top left */}
                {getDriverCode(firstItem) && (
                  <div className="absolute left-2 top-6 z-30 flex h-[100%] w-5 md:w-6 items-start justify-center">
                    <span
                      className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                      style={{
                        fontSize: 'clamp(30px, 2.5vw, 20px)',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0.05em',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center center',
                      }}
                    >
                      {getDriverCode(firstItem)}
                    </span>
                  </div>
                )}
                {/* Rating/Rank number on top right */}
                <div className="absolute top-2 right-2 z-30">
                  <div className="text-[clamp(4rem,8vw,3.75rem)] font-bold text-white leading-none">1</div>
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
                    <div className="text-[clamp(8px,2vw,10px)] font-bold text-white/30 leading-none">{rank}</div>
                  </div>
                  <Plus className="h-6 w-6 text-white/50 md:h-8 md:w-8" strokeWidth={1.5} aria-hidden />
                </Link>
              ) : (
                <div
                  key={item.id}
                  className="relative block aspect-square w-full min-w-0 rounded-lg overflow-hidden border border-dashed border-white/20 bg-white/5"
                >
                  <div className="absolute top-0.5 right-0.5 z-30">
                    <div className="text-[clamp(8px,2vw,10px)] font-bold text-white/30 leading-none">{rank}</div>
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
                {/* Dark overlay (tracks and teams) */}
                {(grid.type === 'track' || grid.type === 'team') && (
                  <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
                )}
                {/* Track SVG from storage: scale + bleed right (matches pitlane track cards) */}
                {grid.type === 'track' && getItemImageUrl(item) && !failedTrackIds.has(item.id) && (
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center p-0.5"
                    style={{ transform: 'scale(1.7)', transformOrigin: '-2% 40%' }}
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
                {/* Team: centered uppercase Inter text overlay (small tiles) */}
                {grid.type === 'team' && (
                  <span
                    className="absolute inset-0 z-10 flex items-center justify-center px-0.5 text-center text-white font-semibold uppercase leading-tight line-clamp-2"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '10px',
                    }}
                  >
                    {item.name}
                  </span>
                )}
                {/* Track: vertical text on left edge, centered at half height (small tiles) */}
                {grid.type === 'track' && getTrackDisplayText(item) && (
                  <div className="absolute left-0.5 top-1/2 z-10 flex h-[100%] w-[12px] -translate-y-1/2 items-center justify-center">
                    <span
                      className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '9px',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center center',
                      }}
                    >
                      {getTrackDisplayText(item)}
                    </span>
                  </div>
                )}
                {/* Overlay gradient for text readability (drivers/tracks) */}
                {grid.type !== 'team' && (
                  <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}
                {/* Driver short code: vertical text near top left (small tiles) */}
                {getDriverCode(item) && (
                  <div className="absolute left-0.5 top-0 z-30 flex h-[100%] w-[12px] items-center justify-center">
                    <span
                      className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                      style={{
                        fontSize: '9px',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0',
                        transform: 'rotate(-90deg)',
                        transformOrigin: '20% 0%',
                      }}
                    >
                      {getDriverCode(item)}
                    </span>
                  </div>
                )}
                {/* Rating/Rank number on top right */}
                <div className="absolute top-0.5 right-0.5 z-30">
                  <div className="text-[clamp(8px,2vw,10px)] font-bold text-white leading-none">{rank}</div>
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

        {/* Comment - same destination as View Grid */}
        <Link
          href={`/grid/${grid.id}`}
          className="inline-flex items-center gap-1.5 text-sm leading-none text-gray-600 hover:text-gray-900"
        >
          <CommentIcon className="h-5 w-5 shrink-0" />
          {commentCount > 0 && (
            <span className="font-medium leading-none">{commentCount}</span>
          )}
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
