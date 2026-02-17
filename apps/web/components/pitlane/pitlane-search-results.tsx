'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { getTeamBackgroundUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { formatWeekendRange } from '@/utils/date-utils'
import { DriverCardMedia } from '../drivers/driver-card-media'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
  nationality?: string | null
  racing_number?: number | null
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
  end_date: string | null
  circuit_ref?: string | null
}

interface PitlaneSearchResultsProps {
  searchQuery: string
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
  schedule: ScheduleTrack[]
  onClose: () => void
  supabaseUrl?: string
}

export function PitlaneSearchResults({
  searchQuery,
  drivers,
  teams,
  tracks,
  schedule,
  onClose,
  supabaseUrl,
}: PitlaneSearchResultsProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [failedTrackSvgIds, setFailedTrackSvgIds] = useState<Set<string>>(new Set())

  // Filter function for search
  const filterItems = <T extends { name: string }>(items: T[], query: string): T[] => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(lowerQuery))
  }

  // Special filter for schedule that includes circuit_ref
  const filterSchedule = (items: ScheduleTrack[], query: string): ScheduleTrack[] => {
    if (!query.trim()) return []
    const lowerQuery = query.toLowerCase()
    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(lowerQuery)
      const circuitRefMatch = item.circuit_ref?.toLowerCase().includes(lowerQuery) || false
      return nameMatch || circuitRefMatch
    })
  }

  const filteredDrivers = filterItems(drivers, searchQuery)
  const filteredTeams = filterItems(teams, searchQuery)
  const filteredTracks = filterItems(tracks, searchQuery)
  const filteredSchedule = filterSchedule(schedule, searchQuery)

  const hasResults =
    filteredDrivers.length > 0 ||
    filteredTeams.length > 0 ||
    filteredTracks.length > 0 ||
    filteredSchedule.length > 0

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (!searchQuery.trim() || !hasResults) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Results Overlay */}
      <div
        ref={overlayRef}
        className="fixed left-0 right-0 z-50 bg-[#1D1D1D] border-b border-gray-800 shadow-2xl max-h-[calc(100vh-120px)] overflow-y-auto"
        style={{ top: '120px' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">
              Search Results for &quot;{searchQuery}&quot;
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close search results"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Drivers */}
            {filteredDrivers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#838383] uppercase tracking-wide mb-4">
                  Drivers ({filteredDrivers.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredDrivers.map((driver) => {
                    const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
                    const flag = getNationalityFlag(driver.nationality)
                    const parts = driver.name.split(' ')
                    const driverCode = (parts[parts.length - 1] || driver.name).substring(0, 3).toUpperCase()
                    return (
                      <Link
                        key={driver.id}
                        href={`/drivers/${slug}`}
                        onClick={onClose}
                        className="group flex flex-col"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                          <DriverCardMedia
                            driverName={driver.name}
                            supabaseUrl={supabaseUrl}
                            fallbackSrc={driver.headshot_url || driver.image_url}
                            sizes="240px"
                            darkenBackgroundOnly
                          />
                          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden />
                          {driver.racing_number != null && (
                            <div className="absolute right-2 top-2 z-30">
                              <span
                                className="font-bold leading-none tabular-nums font-sageva"
                                style={{ color: '#25B4B1', fontSize: 'clamp(14px, 4vw, 18px)' }}
                              >
                                {driver.racing_number}
                              </span>
                            </div>
                          )}
                          {driverCode && (
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
                                {driverCode}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-start gap-2">
                          {flag ? (
                            <span className="text-base leading-none bg-white bg-opacity-30 rounded-full p-1 self-start">
                              {flag}
                            </span>
                          ) : null}
                          <p className="text-sm text-white group-hover:text-gray-400 lowercase leading-tight">
                            {formatNameWithBreak(driver.name)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Teams */}
            {filteredTeams.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#838383] uppercase tracking-wide mb-4">
                  Teams ({filteredTeams.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredTeams.map((team) => {
                    const slug = team.name.toLowerCase().replace(/\s+/g, '-')
                    const bgUrl = supabaseUrl ? getTeamBackgroundUrl(team.name, supabaseUrl) : null
                    return (
                      <Link
                        key={team.id}
                        href={`/teams/${slug}`}
                        onClick={onClose}
                        className="group flex flex-col"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
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
                        <div className="mt-2">
                          <p className="text-sm text-white group-hover:text-gray-400 lowercase leading-tight">
                            {team.name}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tracks */}
            {filteredTracks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#838383] uppercase tracking-wide mb-4">
                  Tracks ({filteredTracks.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredTracks.map((track) => {
                    const slug = track.name.toLowerCase().replace(/\s+/g, '-')
                    const locationText = track.location ? track.location.toUpperCase() : ''
                    const trackSvgUrl = supabaseUrl ? getTrackSvgUrl(getTrackSlug(track.name), supabaseUrl) : null
                    const showTrackSvg = trackSvgUrl && !failedTrackSvgIds.has(track.id)
                    return (
                      <Link
                        key={track.id}
                        href={`/tracks/${slug}`}
                        onClick={onClose}
                        className="group flex flex-col"
                      >
                        <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                          <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'url(/images/pit_bg.jpg)' }} aria-hidden />
                          <div className="absolute inset-0 z-0 bg-black/40" aria-hidden />
                          {/* Track SVG: scale(1.1) so it's larger and bleeds right (parent overflow-hidden clips) */}
                          {showTrackSvg && (
                            <div
                              className="absolute inset-0 z-10 flex items-center justify-center p-2"
                              style={{ transform: 'scale(2.2)', transformOrigin: '-2% 40%' }}
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
                          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          {locationText && (
                            <div className="absolute left-1 top-1 z-30 flex h-16 w-3 items-center justify-center overflow-visible">
                              <span
                                className="shrink-0 whitespace-nowrap text-white font-bold uppercase leading-none"
                                style={{
                                  fontSize: '7px',
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
                        <div className="mt-2 flex items-start gap-2">
                          <p className="text-sm text-white group-hover:text-gray-400 lowercase leading-tight">
                            {track.name}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Schedule */}
            {filteredSchedule.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#838383] uppercase tracking-wide mb-4">
                  Schedule ({filteredSchedule.length})
                </h3>
                <div className="space-y-3">
                  {filteredSchedule.map((race) => (
                    <ScheduleCard key={race.id} race={race} onClose={onClose} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
    <div className={`relative h-full w-full overflow-hidden ${isTeam ? 'bg-transparent p-4' : 'bg-gray-100'}`}>
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

interface ScheduleCardProps {
  race: ScheduleTrack
  onClose: () => void
}

function ScheduleCard({ race, onClose }: ScheduleCardProps) {
  const dateDisplay =
    formatWeekendRange(race.start_date, race.end_date) ?? 'Date TBA'

  const backgroundImage = race.image_url || '/images/race_banner.jpeg'
  const trackSlug = slugify(race.name)
  const bannerHref = `/tracks/${trackSlug}`

  return (
    <Link
      href={bannerHref}
      onClick={onClose}
      className="block overflow-hidden hover:opacity-90 rounded-sm"
      style={{
        boxShadow: '0 0 20px rgba(255, 0, 110, 0.6), 0 0 10px rgba(253, 53, 50, 0.5), 0 0 25px rgba(253, 99, 0, 0.4), 0 0 0 .5px rgba(255, 0, 110, 0.4)',
      }}
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
          </div>
        </div>
      </section>
    </Link>
  )
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
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
    argentinian: '🇦🇷',
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
