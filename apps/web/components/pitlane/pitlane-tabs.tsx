'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
}

type TabKey = 'drivers' | 'teams' | 'tracks' | 'schedule'

export function PitlaneTabs({ drivers = [], teams = [], tracks = [], schedule = [], searchQuery = '' }: PitlaneTabsProps) {
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
      <sup className="w-full text-left block text-xs text-[#838383] px-2 mb-1">Explore the sport and voice your opinion.</sup>
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden">
        <div className="flex w-full capitalize">
          <TabButton
            label="Drivers"
            active={activeTab === 'drivers'}
            onClick={() => setActiveTab('drivers')}
          />
          <TabButton
            label="Teams"
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
          />
          <TabButton
            label="Tracks"
            active={activeTab === 'tracks'}
            onClick={() => setActiveTab('tracks')}
          />
          <TabButton
            label="Schedule"
            active={activeTab === 'schedule'}
            onClick={() => setActiveTab('schedule')}
          />
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 h-[330px] overflow-scroll">
        {activeTab === 'schedule' ? (
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
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
          <div className="grid gap-4 grid-cols-3">
            {items.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-white/50">
                {searchQuery ? 'No results found matching your search.' : 'Nothing to show yet. Check back soon.'}
              </div>
            ) : (
              items.map((item) => {
                if (activeTab === 'drivers') {
                  const driver = item as Driver
                  const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
                  const imageSrc = driver.headshot_url || driver.image_url
                  const flag = getNationalityFlag(driver.nationality)
                  return (
                    <Link
                      key={driver.id}
                      href={`/drivers/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg mt-2">
                        <Avatar src={imageSrc} alt={driver.name} fallback={driver.name.charAt(0)} />
                      </div>
                      <div className="mt-2 flex items-start gap-2">
                        {flag ? (
                          <span className="text-base leading-none bg-white bg-opacity-30 rounded-full p-1 self-start">
                            {flag}
                          </span>
                        ) : null}
                        <p className="text-sm text-white group-hover:text-gray-500 lowercase leading-tight">
                          {formatNameWithBreak(driver.name)}
                        </p>
                      </div>
                    </Link>
                  )
                }

                if (activeTab === 'teams') {
                  const team = item as Team
                  const slug = team.name.toLowerCase().replace(/\s+/g, '-')
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${slug}`}
                      className="group flex flex-col"
                    >
                      <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg mt-2">
                        <Avatar src={team.image_url} alt={team.name} fallback={team.name.charAt(0)} />
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
                const flag = getCountryFlag(track.country)
                return (
                  <Link
                    key={track.id}
                    href={`/tracks/${slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg mt-2">
                      <Avatar src={track.image_url} alt={track.name} fallback={track.name.charAt(0)} />
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      {flag ? (
                        <span className="text-base leading-none bg-white bg-opacity-30 rounded-full p-1 self-start">
                          {flag}
                        </span>
                      ) : null}
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
  label: string
  active: boolean
  onClick: () => void
  showDivider?: boolean
}

function TabButton({ label, active, onClick, showDivider = false }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm transition w-1/4 capitalize ${
        active ? 'bg-white bg-opacity-30 text-white shadow' : 'bg-[#1D1D1D] text-[#838383] hover:bg-white hover:bg-opacity-30'
      }`}
    >
      {label}
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
}

function Avatar({ src, alt, fallback }: AvatarProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {src ? (
        <Image src={src} alt={alt} fill sizes="240px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-500">
          {fallback}
        </div>
      )}
    </div>
  )
}

function formatNameWithBreak(name: string) {
  const trimmed = name.trim()
  const firstSpaceIndex = trimmed.indexOf(' ')
  if (firstSpaceIndex === -1) return trimmed
  const first = trimmed.slice(0, firstSpaceIndex)
  const rest = trimmed.slice(firstSpaceIndex + 1)
  return (
    <>
      {first}
      <br />
      {rest}
    </>
  )
}

function getNationalityFlag(nationality?: string | null) {
  if (!nationality) return ''
  const normalized = nationality.trim().toLowerCase()
  const flags: Record<string, string> = {
    british: '🇬🇧',
    english: '🇬🇧',
    scottish: '🏴',
    welsh: '🏴',
    dutch: '🇳🇱',
    spanish: '🇪🇸',
    mexican: '🇲🇽',
    monégasque: '🇲🇨',
    monegasque: '🇲🇨',
    finnish: '🇫🇮',
    australian: '🇦🇺',
    canadian: '🇨🇦',
    japanese: '🇯🇵',
    chinese: '🇨🇳',
    german: '🇩🇪',
    french: '🇫🇷',
    italian: '🇮🇹',
    american: '🇺🇸',
    argentine: '🇦🇷',
    brazilian: '🇧🇷',
    thai: '🇹🇭',
    danish: '🇩🇰',
    belgian: '🇧🇪',
    swiss: '🇨🇭',
    new_zealander: '🇳🇿',
    'new zealander': '🇳🇿',
    'south african': '🇿🇦',
    swedish: '🇸🇪',
  }
  return flags[normalized] || ''
}

function getCountryFlag(country?: string | null) {
  if (!country) return ''
  const normalized = country.trim().toLowerCase()
  const flags: Record<string, string> = {
    australia: '🇦🇺',
    austria: '🇦🇹',
    belgium: '🇧🇪',
    brazil: '🇧🇷',
    canada: '🇨🇦',
    china: '🇨🇳',
    france: '🇫🇷',
    germany: '🇩🇪',
    hungary: '🇭🇺',
    italy: '🇮🇹',
    japan: '🇯🇵',
    mexico: '🇲🇽',
    monaco: '🇲🇨',
    netherlands: '🇳🇱',
    qatar: '🇶🇦',
    saudi: '🇸🇦',
    singapore: '🇸🇬',
    spain: '🇪🇸',
    uk: '🇬🇧',
    'united kingdom': '🇬🇧',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    abu_dhabi: '🇦🇪',
    'abu dhabi': '🇦🇪',
    uae: '🇦🇪',
    united_arab_emirates: '🇦🇪',
    'united arab emirates': '🇦🇪',
    sweden: '🇸🇪',
    'swedish': '🇸🇪',
    bahrain: '🇧🇭',
    azerbaijan: '🇦🇿',
    saudi_arabia: '🇸🇦',
    'saudi arabia': '🇸🇦',
  }
  return flags[normalized] || ''
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
      className="block overflow-hidden hover:opacity-90 rounded-sm"
    >
      <section className="relative h-[90px] w-full cursor-pointer">
        <Image
          src={backgroundImage}
          alt={race.circuit_ref || race.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) calc(100vw - 3rem), 1152px"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />

        <div className="absolute inset-0 flex flex-col justify-between">
          <div className="px-2 sm:px-10 text-white space-y-0 pt-2">
            <div className="flex items-center gap-2">
              {race.country ? (
                <span className="text-xl leading-none">
                  {getCountryFlag(race.country)}
                </span>
              ) : null}
              <h2 className="font-display tracking-wider text-lg">{race.circuit_ref || race.name}</h2>
            </div>
            <p className="text-xs text-gray-300 tracking-wide pl-7">
              {dateDisplay}
              {race.location ? ` - ${race.location}` : ''}
              {race.country ? `, ${race.country}` : ''}
            </p>
          </div>
        </div>
      </section>
    </Link>
  )
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}
