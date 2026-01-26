'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getTeamIconUrl } from '@/utils/storage-urls'

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

      <div className="px-4 py-5 sm:px-6 h-[400px] overflow-scroll">
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
          <div className="grid gap-x-7 gap-y-6 grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50">
                {searchQuery ? 'No results found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              items.map((item) => {
                if (activeTab === 'drivers') {
                  const driver = item as Driver
                  const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
                  const imageSrc = driver.headshot_url || driver.image_url
                  return (
                    <Link
                      key={driver.id}
                      href={`/drivers/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-25 h-28 overflow-hidden rounded-2xl">
                        <Avatar src={imageSrc} alt={driver.name} fallback={driver.name.charAt(0)} />
                      </div>
                    </Link>
                  )
                }

                if (activeTab === 'teams') {
                  const team = item as Team
                  const slug = team.name.toLowerCase().replace(/\s+/g, '-')
                  const iconUrl = supabaseUrl ? getTeamIconUrl(team.name, supabaseUrl) : null
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                        <div 
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }}
                        />
                        <Avatar src={iconUrl} alt={team.name} fallback={team.name.charAt(0)} variant="team" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-sm text-white group-hover:text-gray-500 lowercase leading-tight">
                          {team.name}
                        </p>
                      </div>
                    </Link>
                  )
                }

                const track = item as Track
                const slug = track.name.toLowerCase().replace(/\s+/g, '-')
                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }}
                      />
                      <Avatar src={track.image_url} alt={track.name} fallback={track.name.charAt(0)} />
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      <p className="text-sm text-white group-hover:text-gray-500 lowercase leading-tight">
                        {track.name}
                      </p>
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
    australia: 'australia',
    austria: 'austria',
    belgium: 'belgium',
    brazil: 'brazil',
    canada: 'canada',
    china: 'china',
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
