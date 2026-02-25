'use client'

import Link from 'next/link'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { DriverCardMedia } from '@/components/drivers/driver-card-media'
import {
  getTeamBackgroundUrl,
  getTrackSlug,
  getTrackSvgUrl,
} from '@/utils/storage-urls'

export interface FeaturedGridCarouselGrid {
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

export interface FeaturedGridCarouselUser {
  id: string
  username: string
  profile_image_url: string | null
}

interface FeaturedGridCarouselCardProps {
  grid: FeaturedGridCarouselGrid
  user: FeaturedGridCarouselUser | null
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

/** Driver shortcode: last name first 3 letters, uppercase (matches profile/feed grid cards) */
function getDriverCode(name: string): string {
  const parts = name.split(' ')
  const lastName = parts[parts.length - 1] || name
  return lastName.substring(0, 3).toUpperCase()
}

export function FeaturedGridCarouselCard({
  grid,
  user,
  supabaseUrl,
}: FeaturedGridCarouselCardProps) {
  const topThree = (grid.ranked_items ?? []).slice(0, 3)
  const type = grid.type

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left 1/3: large circular profile image + username */}
        <div className="flex w-1/3 min-w-0 flex-shrink-0 flex-col items-center justify-start">
          <Link
            href={user?.username ? `/u/${user.username}` : '#'}
            className="flex flex-col items-center"
            aria-label={user?.username ? `View ${user.username}'s profile` : undefined}
          >
            <div
              className={`h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-full ${
                isDefaultAvatar(user?.profile_image_url) ? 'border border-gray-200 bg-white' : ''
              }`}
            >
              <img
                src={getAvatarUrl(user?.profile_image_url)}
                alt={user?.username ?? ''}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          </Link>
        </div>

        {/* Right 2/3: 3 equal squares + View more */}
        <div className="flex min-w-0 flex-1 flex-col">
        <h2 className="mb-2 shrink-0 text-sm font-bold text-white text-center">{user?.username ?? 'Unknown'} Driver Grid</h2>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[0, 1, 2].map((index) => {
              const rank = index + 1
              const item = topThree[index]
              if (!item || item.is_placeholder) {
                return (
                  <div
                    key={index}
                    className="aspect-square w-full min-w-0 rounded-lg border border-dashed border-white/20 bg-white/5"
                  />
                )
              }
              const imageUrl = getItemImageUrl(type, item, supabaseUrl)
              const driverCode = type === 'driver' ? getDriverCode(item.name) : ''
              return (
                <Link
                  key={item.id}
                  href={`/grid/${grid.id}`}
                  className="relative block aspect-square w-full min-w-0 overflow-hidden rounded-lg transition-opacity hover:opacity-90"
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
                        sizes="(max-width: 768px) 28vw, 80px"
                      />
                    </div>
                  )}
                  {type === 'track' && <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />}
                  {type === 'team' && <div className="absolute inset-0 z-0 bg-black/30" aria-hidden />}
                  {type === 'track' && imageUrl && (
                    <div
                      className="absolute inset-0 z-10 flex items-center justify-center p-0.5"
                      style={{ transform: 'scale(2.2)', transformOrigin: '-20% 40%' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        aria-hidden
                      />
                    </div>
                  )}
                  {/* Overlay gradient for text readability (matches profile/feed grid cards) */}
                  {type !== 'team' && (
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
                  )}
                  {/* Position (rank) top right - matches profile/feed grid cards */}
                  <div className="absolute top-0 right-0.5 z-30">
                    <span className="text-[clamp(0.4rem,2.5vw,0.75rem)] font-bold leading-none tabular-nums text-white">
                      {rank}
                    </span>
                  </div>
                  {/* Driver shortcode: vertical left - matches profile/feed grid cards */}
                  {type === 'driver' && driverCode && (
                    <div
                      className="absolute left-0.5 bottom-0 z-20 flex h-[44px] w-3 items-center justify-center overflow-visible pointer-events-none"
                    >
                      <span
                        className="whitespace-nowrap font-bold uppercase leading-none select-none tracking-widest text-white"
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 900,
                          fontSize: 'clamp(0.5rem, 2vw, 0.75rem)',
                          letterSpacing: '0',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'center center',
                        }}
                      >
                        {driverCode}
                      </span>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="mt-5 sm:mt-2 flex justify-end">
            <Link
              href={`/grid/${grid.id}`}
              className="text-xs font-medium text-white hover:text-sunset-start"
            >
              View more →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
