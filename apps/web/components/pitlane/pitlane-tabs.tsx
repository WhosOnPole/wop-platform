'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { DriverCardMedia } from '../drivers/driver-card-media'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
  nationality?: string | null
}

interface Team {
  id: string
  name: string
  image_url?: string | null
}

interface Track {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  country?: string | null
}

interface ScheduleTrack {
  id: string
  name: string
  image_url?: string | null
  location?: string | null
  country?: string | null
  start_date: string | null
  race_day_date: string | null
  circuit_ref?: string | null
}

interface PitlaneTabsProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  searchQuery: string
  supabaseUrl?: string
}

type TabKey = 'drivers' | 'teams' | 'tracks' | 'schedule'

export function PitlaneTabs({ drivers = [], teams = [], tracks = [], schedule = [], searchQuery = '', supabaseUrl }: PitlaneTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('drivers')
  const [failedTrackSvgIds, setFailedTrackSvgIds] = useState<Set<string>>(new Set())
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  const TAB_ORDER: TabKey[] = ['drivers', 'tracks', 'teams', 'schedule']
  const SWIPE_THRESHOLD = 50 // Minimum distance in pixels

  // Filter function for search
  const filterItems = <T extends { name: string }>(items: T[] | undefined, query: string): T[] => {
    if (!items) return []
    if (!query.trim()) return items
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lowerQuery))
  }

  // Special filter for schedule that includes circuit_ref
  const filterSchedule = (items: ScheduleTrack[] | undefined, query: string): ScheduleTrack[] => {
    if (!items) return []
    if (!query.trim()) return items
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(lowerQuery)
      const circuitRefMatch = item.circuit_ref?.toLowerCase().includes(lowerQuery) || false
      return nameMatch || circuitRefMatch
    })
  }

  const filteredDrivers = useMemo(() => filterItems(drivers, searchQuery), [drivers, searchQuery])
  const filteredTeams = useMemo(() => filterItems(teams, searchQuery), [teams, searchQuery])
  const filteredTracks = useMemo(() => filterItems(tracks, searchQuery), [tracks, searchQuery])
  const filteredSchedule = useMemo(() => filterSchedule(schedule, searchQuery), [schedule, searchQuery])

  const items = useMemo(() => {
    if (activeTab === 'drivers') return filteredDrivers
    if (activeTab === 'teams') return filteredTeams
    if (activeTab === 'schedule') return filteredSchedule
    return filteredTracks
  }, [activeTab, filteredDrivers, filteredTeams, filteredTracks, filteredSchedule])

  // Mobile swipe gesture detection (match profile behavior)
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (!isMobile || !contentRef.current) return

    const content = contentRef.current

    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isSwipe.current = false
    }

    function handleTouchMove(e: TouchEvent) {
      if (!touchStartX.current || !touchStartY.current) return

      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      const deltaX = touchX - touchStartX.current
      const deltaY = touchY - touchStartY.current

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwipe.current = true
        e.preventDefault()
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!touchStartX.current || !touchStartY.current || !isSwipe.current) {
        touchStartX.current = 0
        touchStartY.current = 0
        return
      }

      const touchX = e.changedTouches[0].clientX
      const touchY = e.changedTouches[0].clientY
      const deltaX = touchX - touchStartX.current
      const deltaY = touchY - touchStartY.current
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      if (absDeltaX > SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
        const currentIndex = TAB_ORDER.indexOf(activeTab)
        const nextIndex =
          deltaX > 0
            ? currentIndex === 0
              ? TAB_ORDER.length - 1
              : currentIndex - 1
            : currentIndex === TAB_ORDER.length - 1
              ? 0
              : currentIndex + 1

        setActiveTab(TAB_ORDER[nextIndex])
      }

      touchStartX.current = 0
      touchStartY.current = 0
      isSwipe.current = false
    }

    content.addEventListener('touchstart', handleTouchStart, { passive: true })
    content.addEventListener('touchmove', handleTouchMove, { passive: false })
    content.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      content.removeEventListener('touchstart', handleTouchStart)
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
    }
  }, [activeTab])

  return (
    <section>
      <sup className="w-full text-left block text-xs text-[#838383] ">Explore the sport and voice your opinion</sup>
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden">
        <div className="flex w-full">
          <TabButton
            label="DRIVERS"
            active={activeTab === 'drivers'}
            onClick={() => setActiveTab('drivers')}
            showDivider={true}
          />
          <TabButton
            label="TRACKS"
            active={activeTab === 'tracks'}
            onClick={() => setActiveTab('tracks')}
            showDivider={true}
          />
          <TabButton
            label="TEAMS"
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
            showDivider={true}
          />
          <TabButton
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
                <path d="M3.27769 0V1.45494C3.27769 1.54871 3.40449 1.8659 3.45687 1.96244C3.90895 2.79679 5.10945 2.84092 5.65664 2.07001C5.7228 1.97623 5.89095 1.61905 5.89095 1.51975V0H11.1175V1.55285C11.1175 2.02174 11.797 2.57062 12.2449 2.61475C12.9258 2.68232 13.7307 2.14724 13.7307 1.42184V0H15.1849C16.1497 0 17.0304 1.03294 16.9973 1.97761V13.6805C16.9394 14.6776 16.424 15.4113 15.4316 15.643C10.9576 15.7533 6.46571 15.6568 1.98484 15.6912C1.01038 15.6319 0.27023 15.0955 0.0565926 14.1218C-0.0274839 9.96528 -0.00680938 5.78251 0.0469445 1.62181C0.150317 0.790217 1.01451 0 1.85666 0H3.27769ZM1.36598 3.9235L1.31636 3.97315V13.7798C1.31636 13.795 1.36322 13.9508 1.37425 13.9826C1.48727 14.2956 1.74777 14.3563 2.04962 14.3853H14.9244C15.2124 14.3673 15.5074 14.3025 15.619 14.0019C15.6356 13.955 15.6907 13.7481 15.6907 13.715V3.97177L15.6411 3.92212H1.36598V3.9235Z" fill="white" fillOpacity="0.4"/>
              </svg>
            }
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          />
        </div>
      </div>

      <div ref={contentRef} className="px-4 py-5 sm:px-6 h-[400px] overflow-scroll">
        {activeTab === 'schedule' ? (
          <div className="space-y-0 md:grid md:grid-cols-2 md:gap-4">
            {!filteredSchedule || filteredSchedule.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50 md:col-span-2">
                {searchQuery ? 'No races found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              filteredSchedule.map((race) => (
                <ScheduleCard key={race.id} race={race} />
              ))
            )}
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-4 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50">
                {searchQuery ? 'No results found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              items.map((item) => {
                if (activeTab === 'drivers') {
                  const driver = item as Driver
                  const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
                  const parts = driver.name.split(' ')
                  const driverCode = (parts[parts.length - 1] || driver.name).substring(0, 3).toUpperCase()
                  return (
                    <Link
                      key={driver.id}
                      href={`/drivers/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                        <DriverCardMedia
                          driverName={driver.name}
                          supabaseUrl={supabaseUrl}
                          fallbackSrc={driver.headshot_url || driver.image_url}
                          sizes="100px"
                          darkenBackgroundOnly
                        />
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
                        {driverCode && (
                          <div className="absolute left-2 top-0 z-30 flex h-16 w-3 items-center justify-center overflow-visible">
                            <span
                              className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                              style={{
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif',
                                letterSpacing: '0',
                                transform: 'rotate(-90deg)',
                                transformOrigin: '20% 0',
                              }}
                            >
                              {driverCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                }

                if (activeTab === 'teams') {
                  const team = item as Team
                  const slug = team.name.toLowerCase().replace(/\s+/g, '-')
                  const bgUrl = supabaseUrl ? getTeamBackgroundUrl(team.name, supabaseUrl) : null
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                        <div
                          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: bgUrl ? `url(${bgUrl})` : 'url(/images/pit_bg.jpg)',
                          }}
                          aria-hidden
                        />
                        <div className="absolute inset-0 z-10 bg-black/30" aria-hidden />
                        <span
                          className="absolute inset-0 z-20 flex items-center justify-center px-2 text-center text-white font-semibold uppercase leading-tight line-clamp-2"
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 'clamp(10px, 2.5vw, 14px)',
                          }}
                        >
                          {team.name}
                        </span>
                      </div>
                    </Link>
                  )
                }

                const track = item as Track
                const slug = track.name.toLowerCase().replace(/\s+/g, '-')
                const locationText = track.location ? track.location.toUpperCase() : ''
                const trackSvgUrl = supabaseUrl ? getTrackSvgUrl(getTrackSlug(track.name), supabaseUrl) : null
                const showTrackSvg = trackSvgUrl && !failedTrackSvgIds.has(track.id)
                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }} aria-hidden />
                      <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
                      {/* Track SVG from storage: scale(1.1) so it's larger and bleeds right (parent overflow-hidden clips) */}
                      {showTrackSvg && (
                        <div
                          className="absolute inset-0 z-10 flex items-center justify-center p-2"
                          style={{ transform: 'scale(1.7)', transformOrigin: '-2% 40%' }}
                        >
                          <img
                            src={trackSvgUrl}
                            alt=""
                            className="h-full max-h-full w-auto object-contain"
                            onError={() => setFailedTrackSvgIds((s) => new Set(s).add(track.id))}
                            aria-hidden
                          />
                        </div>
                      )}
                      {/* Overlay gradient for text readability */}
                      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      {/* Vertical location on left edge (rotate -90deg like grid titles) */}
                      {locationText && (
                        <div className="absolute left-1 top-4 z-30 flex h-16 w-3 items-center justify-center overflow-visible">
                          <span
                            className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                            style={{
                              fontSize: '12px',
                              fontFamily: 'Inter, sans-serif',
                              letterSpacing: '0',
                              transform: 'rotate(-90deg)',
                              transformOrigin: 'center center',
                            }}
                          >
                            {locationText}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </div>
    </section>
  )
}

interface TabButtonProps {
  label?: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
  showDivider?: boolean
}

function TabButton({ label, icon, active, onClick, showDivider = false }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-xs tracking-wide transition w-1/4 uppercase bg-white hover:text-white flex items-center justify-center ${
        active ? 'text-white bg-opacity-30' : ' text-[#FFFFFF50] bg-opacity-[19%]'
      }`}
    >
      {icon || label}
      {showDivider ? (
        <span className="pointer-events-none absolute right-0 top-1 bottom-1 w-[.5px] bg-white/20" />
      ) : null}
    </button>
  )
}

interface AvatarProps {
  src?: string | null
  alt: string
  fallback: string
  variant?: 'default' | 'team'
}

function Avatar({ src, alt, fallback, variant = 'default' }: AvatarProps) {
  const isTeam = variant === 'team'
  return (
    <div className={`relative h-full w-full overflow-hidden ${isTeam ? 'bg-transparent p-4' : ''}`}>
      {src ? (
        <Image 
          src={src} 
          alt={alt} 
          fill 
          sizes="240px" 
          className={isTeam ? 'object-contain brightness-0 invert' : 'object-cover'} 
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-500">
          {fallback}
        </div>
      )}
    </div>
  )
}


interface ScheduleCardProps {
  race: ScheduleTrack
}

function ScheduleCard({ race }: ScheduleCardProps) {
  // Format dates in short format
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const startDateFormatted = formatShortDate(race.start_date)
  const raceDayDateFormatted = formatShortDate(race.race_day_date)

  // Build date display string
  let dateDisplay = 'Date TBA'
  if (startDateFormatted && raceDayDateFormatted) {
    dateDisplay = `${startDateFormatted}`
  } else if (startDateFormatted) {
    dateDisplay = `Start: ${startDateFormatted}`
  } else if (raceDayDateFormatted) {
    dateDisplay = `Race Day: ${raceDayDateFormatted}`
  }

  const backgroundImage = race.image_url || '/images/race_banner.png'
  const trackSlug = slugify(race.name)
  const bannerHref = `/tracks/${trackSlug}`

  return (
    <Link
      href={bannerHref}
      className="block overflow-hidden hover:opacity-90 rounded-sm border-b border-gray-900"
    >
      <section className="relative h-[90px] w-full cursor-pointer">
        {/* <Image
          src={backgroundImage}
          alt={race.circuit_ref || race.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) calc(100vw - 3rem), 1152px"
          className="object-cover opacity-30"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-between">
          <div className="px-2 sm:px-10 text-white space-y-0 pt-2">
            <div className="flex items-center gap-2">
              {race.country && getCountryFlagPath(race.country) ? (
                <Image
                  src={getCountryFlagPath(race.country)!}
                  alt={race.country}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              ) : null}
              <h2 className="font-display tracking-wider text-lg">{race.circuit_ref || race.name}</h2>
            </div>
            <p className="text-xs text-gray-300 tracking-wide pl-7">
              {dateDisplay}
              {race.location ? ` - ${race.location}` : ''}
              {race.country ? `, ${race.country}` : ''}
            </p>
            <p className="text-xs text-gray-300 tracking-wide pl-7">{race.circuit_ref ? `${race.name}` : ''}</p>
          </div>
        </div>
      </section>
    </Link>
  )
}

function getCountryFlagPath(country?: string | null): string | null {
  if (!country) return null
  const normalized = country.trim().toLowerCase()
  
  // Map country to flag file name
  const flagMap: Record<string, string> = {
    argentina: 'argentina',
    argentine: 'argentina',
    australia: 'australia',
    austria: 'austria',
    belgium: 'belgium',
    brazil: 'brazil',
    canada: 'canada',
    china: 'china',
    france: 'france',
    germany: 'germany',
    hungary: 'hungary',
    italy: 'italy',
    japan: 'japan',
    mexico: 'mexico',
    monaco: 'monaco',
    netherlands: 'netherlands',
    qatar: 'qatar',
    singapore: 'singapore',
    spain: 'spain',
    uk: 'uk',
    'united kingdom': 'uk',
    'united states': 'usa',
    usa: 'usa',
    abu_dhabi: 'uae',
    'abu dhabi': 'uae',
    uae: 'uae',
    united_arab_emirates: 'uae',
    'united arab emirates': 'uae',
    bahrain: 'bahrain',
    azerbaijan: 'azerbaijan',
    saudi: 'saudi_arabia',
    saudi_arabia: 'saudi_arabia',
    'saudi arabia': 'saudi_arabia',
  }
  
  const flagName = flagMap[normalized]
  if (!flagName) return null
  
  return `/images/flags/${flagName}_flag.svg`
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}
