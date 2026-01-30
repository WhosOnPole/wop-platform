'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ChevronRight } from 'lucide-react'
import { GridHeartButton } from './grid-heart-button'
import { GridSnapshot } from './grid-snapshot'
import { getTeamIconUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { DriverCardMedia } from '../drivers/driver-card-media'

interface GridItem {
  id: string
  name: string
  image_url?: string | null
  headshot_url?: string | null
  country?: string | null
}

interface GridDisplayCardProps {
  grid: {
    id: string
    type: 'driver' | 'team' | 'track'
    ranked_items: Array<GridItem>
    blurb?: string | null
    like_count?: number
    is_liked?: boolean
    previous_state?: Array<GridItem> | null
    updated_at?: string | null
  }
  isOwnProfile: boolean
  supabaseUrl?: string
  onCommentClick?: () => void
}

export function GridDisplayCard({
  grid,
  isOwnProfile,
  supabaseUrl,
  onCommentClick,
}: GridDisplayCardProps) {
  const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
  const firstItem = rankedItems[0]
  const otherItems = rankedItems.slice(1, 10) // Items 2-10

  const [firstTrackSvgFailed, setFirstTrackSvgFailed] = useState(false)
  const [failedTrackIds, setFailedTrackIds] = useState<Set<string>>(new Set())

  // Get image URL for an item (tracks use storage SVG, not image_url)
  function getItemImageUrl(item: GridItem): string | null {
    if (grid.type === 'driver') {
      return item.headshot_url || item.image_url || null
    } else if (grid.type === 'team') {
      return supabaseUrl ? getTeamIconUrl(item.name, supabaseUrl) : null
    } else if (grid.type === 'track') {
      return supabaseUrl ? getTrackSvgUrl(getTrackSlug(item.name), supabaseUrl) : null
    }
    return null
  }

  // Generate slug for item
  function getItemSlug(item: { id: string; name: string }): string {
    return item.name.toLowerCase().replace(/\s+/g, '-')
  }

  // Get item href
  function getItemHref(item: { id: string; name: string }): string {
    const slug = getItemSlug(item)
    if (grid.type === 'driver') return `/drivers/${slug}`
    if (grid.type === 'team') return `/teams/${slug}`
    if (grid.type === 'track') return `/tracks/${slug}`
    return '#'
  }

  // Format vertical text for left edge
  function getVerticalText(item: GridItem): string {
    if (grid.type === 'driver') {
      // First 3 letters of LAST name, all caps
      const parts = item.name.split(' ')
      const lastName = parts[parts.length - 1] || item.name
      return lastName.substring(0, 3).toUpperCase()
    } else if (grid.type === 'team') {
      // Teams: no text
      return ''
    } else if (grid.type === 'track') {
      // Country, all caps
      return (item.country || '').toUpperCase()
    }
    return ''
  }

  // TODO: Get actual comment count - need to fetch from posts/comments
  const commentCount = 0 // Placeholder

  return (
    <div className="mb-8 shadow-sm">
      {/* Grid Title */}
      <div className="mb-4 flex items-center justify-between">
        {isOwnProfile && (
          <Link
            href={`/profile/edit-grid/${grid.type}`}
            className="text-sm text-white hover:text-sunset-end"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Grid Blurb */}
      {grid.blurb && (
        <p className="mb-4 text-sm italic text-gray-600">&quot;{grid.blurb}&quot;</p>
      )}

      {/* Grid Display: #1 (50%) + Items 2-10 (3x3 grid, 50%) */}
      <div className="mb-4 flex gap-4">
        {/* #1 Item - 50% width */}
        {firstItem && (
          <div className="w-1/2">
            <Link
              href={getItemHref(firstItem)}
              className="relative block h-[170px] w-[170px] rounded-xl border border-[#666666]/10 overflow-hidden hover:opacity-90 transition-opacity"
              style={
                grid.type === 'driver'
                  ? undefined
                  : {
                      backgroundImage:
                        grid.type === 'track'
                          ? undefined
                          : getItemImageUrl(firstItem)
                            ? `url(${getItemImageUrl(firstItem)})`
                            : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor:
                        grid.type === 'track'
                          ? 'rgb(55 65 81)'
                          : getItemImageUrl(firstItem)
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
                    sizes="170px"
                  />
                </div>
              )}
              {/* Overlay gradient for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Vertical text on left edge */}
              {getVerticalText(firstItem) && (
                <div className="absolute left-2 top-2 flex flex-col items-start">
                  <div 
                    className="text-white font-bold leading-tight"
                    style={{
                      fontSize: grid.type === 'driver' ? '20px' : '18px',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {getVerticalText(firstItem).split('').map((char, i) => (
                      <span key={i} className="block">{char}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rating/Rank number on top right */}
              <div className="absolute top-2 right-2">
                <div className="text-6xl font-bold text-white leading-none">1</div>
              </div>
              
              {/* Track SVG from storage (tracks only) */}
              {grid.type === 'track' && getItemImageUrl(firstItem) && !firstTrackSvgFailed && (
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img
                    src={getItemImageUrl(firstItem)!}
                    alt=""
                    className="h-full max-h-full w-auto object-contain opacity-90"
                    onError={() => setFirstTrackSvgFailed(true)}
                    aria-hidden
                  />
                </div>
              )}

              {/* Fallback if no image (non-tracks) */}
              {grid.type !== 'track' && !getItemImageUrl(firstItem) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-600">
                    {firstItem.name.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
          </div>
        )}

        {/* Items 2-10 - 3x3 grid, 50% width */}
        <div className="w-1/2 grid grid-cols-3 gap-2">
          {otherItems.map((item, index) => {
            const rank = index + 2
            return (
              <Link
                key={item.id}
                href={getItemHref(item)}
                className="relative block h-[50px] w-[50px] rounded-lg border border-gray-200 overflow-hidden hover:opacity-90 transition-opacity"
                style={
                  grid.type === 'driver'
                    ? undefined
                    : {
                        backgroundImage:
                          grid.type === 'track'
                            ? undefined
                            : getItemImageUrl(item)
                              ? `url(${getItemImageUrl(item)})`
                              : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor:
                          grid.type === 'track'
                            ? 'rgb(55 65 81)'
                            : getItemImageUrl(item)
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
                      sizes="50px"
                    />
                  </div>
                )}
                {/* Overlay gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Vertical text on left edge */}
                {getVerticalText(item) && (
                  <div className="absolute left-0.5 top-0.5 flex flex-col items-start">
                    <div 
                      className="text-white font-bold leading-tighter"
                      style={{
                        fontSize: grid.type === 'driver' ? '8px' : '7px',
                        fontFamily: 'Inter, sans-serif',
                        letterSpacing: '0',
                      }}
                    >
                      {getVerticalText(item).split('').map((char, i) => (
                        <span key={i} className="block">{char}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Rating/Rank number on top right */}
                <div className="absolute top-0.5 right-0.5">
                  <div className="text-[10px] font-bold text-white leading-none">{rank}</div>
                </div>

                {/* Track SVG from storage (tracks only) */}
                {grid.type === 'track' && getItemImageUrl(item) && !failedTrackIds.has(item.id) && (
                  <div className="absolute inset-0 flex items-center justify-center p-0.5">
                    <img
                      src={getItemImageUrl(item)!}
                      alt=""
                      className="h-full max-h-full w-auto object-contain opacity-90"
                      onError={() => setFailedTrackIds((s) => new Set(s).add(item.id))}
                      aria-hidden
                    />
                  </div>
                )}

              </Link>
            )
          })}
        </div>
      </div>

      {/* Actions: Comment, Like, View More - Left aligned */}
      <div className="flex items-center gap-4">
        {/* Comment Bubble */}
        <button
          onClick={onCommentClick}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" className="h-4 w-4">
            <path d="M8.49841 1.12544C7.88463 1.12544 7.27502 1.19733 6.6862 1.33916C6.11512 1.47674 5.56178 1.68047 5.04135 1.9446C4.52948 2.20448 4.04979 2.52259 3.61585 2.8902C3.18314 3.25666 2.79716 3.671 2.46856 4.12187C2.45314 4.14311 2.43932 4.16068 2.42904 4.17354C2.32469 4.31997 2.22009 4.48224 2.10974 4.66897C2.06741 4.74132 2.02349 4.82653 1.97712 4.91656C1.96574 4.93873 1.95437 4.96078 1.94287 4.98294L1.94226 4.98409L1.94164 4.98524C1.92843 5.01062 1.9151 5.03588 1.90176 5.06115C1.87326 5.11501 1.84646 5.16588 1.82603 5.20883C1.77428 5.31897 1.72596 5.43587 1.66944 5.57747L1.66919 5.57805L1.66895 5.57862L1.65647 5.60974C1.6331 5.66785 1.61108 5.72286 1.5931 5.77201C1.54918 5.89306 1.50746 6.02122 1.46574 6.16316C1.44825 6.22265 1.43027 6.28834 1.41069 6.36402C1.3713 6.51572 1.34243 6.64113 1.31967 6.7585C1.31013 6.80765 1.3012 6.86622 1.29178 6.92835C1.2886 6.9489 1.28554 6.96946 1.28236 6.99013V6.99082L1.28211 6.99151L1.27893 7.01207C1.25899 7.13965 1.24003 7.26012 1.22951 7.36968C1.22364 7.43238 1.22058 7.50818 1.2174 7.58845C1.21605 7.62084 1.21483 7.65322 1.21336 7.68549V7.68607V7.68664C1.21128 7.73177 1.20871 7.77369 1.20626 7.81423C1.20247 7.87682 1.1988 7.93596 1.1988 7.98098C1.1988 8.44195 1.24309 8.86226 1.33423 9.26605C1.34365 9.30808 1.35062 9.35022 1.35503 9.39237C1.52104 10.134 1.81637 10.8405 2.2333 11.4937C2.65904 12.1605 3.19819 12.7515 3.83582 13.2502C4.47798 13.7525 5.19856 14.1441 5.97749 14.4144C6.78334 14.6939 7.63139 14.8356 8.49829 14.8356C9.61965 14.8356 10.706 14.5951 11.7273 14.1208C11.9481 14.0182 12.1949 13.9638 12.4408 13.9638C12.7647 13.9638 13.0773 14.0544 13.3449 14.2258L14.0405 14.6692L13.8671 13.3814C13.8396 13.1795 13.8555 12.9777 13.9144 12.7817C13.973 12.5862 14.0712 12.4068 14.2063 12.2482C14.7264 11.6364 15.1265 10.961 15.3956 10.2408C15.6647 9.52088 15.8011 8.7604 15.8011 7.98052C15.8011 4.20065 12.5251 1.12544 8.49841 1.12544ZM8.49841 0C13.1862 0 17 3.58005 17 7.98052C17 9.80304 16.3578 11.522 15.1428 12.9511C15.0736 13.032 15.0425 13.136 15.0565 13.2387L15.5628 17L12.6703 15.1561C12.6017 15.1119 12.5217 15.0893 12.4409 15.0893C12.3791 15.0893 12.317 15.1025 12.2591 15.1295C11.0712 15.6812 9.80573 15.961 8.49841 15.961C4.37154 15.961 0.925373 13.1852 0.159163 9.51892C0.158062 9.51215 0.162954 9.50606 0.161488 9.49929C0.0528488 9.01764 0 8.52107 0 7.98098C0 7.86602 0.010397 7.75198 0.0157814 7.63737C0.0214081 7.51472 0.0240993 7.39127 0.0355988 7.27011C0.0497913 7.12185 0.0732803 6.97486 0.0962811 6.82786C0.11035 6.73748 0.123072 6.64676 0.140322 6.55741C0.170296 6.40318 0.206631 6.25021 0.246023 6.09805C0.266333 6.01984 0.287374 5.94186 0.310129 5.86458C0.355028 5.71149 0.403963 5.55944 0.458527 5.40935C0.486298 5.33298 0.516882 5.25799 0.546978 5.18277C0.604721 5.03818 0.663811 4.89406 0.730242 4.7528C0.772203 4.66414 0.819304 4.57836 0.864569 4.49142C0.928308 4.3682 0.990335 4.24417 1.0608 4.12416C1.18155 3.91975 1.30927 3.71946 1.44801 3.52653C1.45779 3.51287 1.46917 3.50023 1.47908 3.48668C3.01162 1.38372 5.58539 0 8.49841 0Z" fill="currentColor"/>
          </svg>
          <span className="text-sm">{commentCount}</span>
        </button>

        {/* Like Heart */}
        {!isOwnProfile ? (
          <GridHeartButton
            gridId={grid.id}
            initialLikeCount={grid.like_count || 0}
            initialIsLiked={grid.is_liked || false}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">{grid.like_count || 0}</span>
          </div>
        )}

        <Link
          href={`/grid/${grid.id}`}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          View more <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid Snapshot (if history exists) */}
      {grid.previous_state && grid.updated_at && (
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
