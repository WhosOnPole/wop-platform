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

interface PitlaneTabsProps {
  drivers: Driver[]
  teams: Team[]
  tracks: Track[]
}

type TabKey = 'drivers' | 'teams' | 'tracks'

export function PitlaneTabs({ drivers, teams, tracks }: PitlaneTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('drivers')

  const items = useMemo(() => {
    if (activeTab === 'drivers') return drivers
    if (activeTab === 'teams') return teams
    return tracks
  }, [activeTab, drivers, teams, tracks])

  return (
    <section>
      <sup className="w-full text-left block text-xs text-[#838383] px-2">Explore the sport and voice your opinion.</sup>
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden">
        <div className="flex w-full capitalize">
          <TabButton
            label="Drivers"
            active={activeTab === 'drivers'}
            onClick={() => setActiveTab('drivers')}
            showDivider
          />
          <TabButton
            label="Teams"
            active={activeTab === 'teams'}
            onClick={() => setActiveTab('teams')}
            showDivider
          />
          <TabButton
            label="Tracks"
            active={activeTab === 'tracks'}
            onClick={() => setActiveTab('tracks')}
          />
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 h-[400px] overflow-scroll">
        <div className="grid gap-4 grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm #FFFFFF33">
              Nothing to show yet. Check back soon.
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
      className={`relative px-4 py-2 text-sm transition w-1/3 capitalize ${
        active ? 'bg-white bg-opacity-30 text-white shadow' : 'bg-white bg-opacity-20 text-[#838383] hover:bg-white hover:bg-opacity-30'
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
    argentinian: '🇦🇷',
    brazilian: '🇧🇷',
    thai: '🇹🇭',
    danish: '🇩🇰',
    belgian: '🇧🇪',
    swiss: '🇨🇭',
    new_zealander: '🇳🇿',
    'new zealander': '🇳🇿',
    'south african': '🇿🇦',
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
  }
  return flags[normalized] || ''
}
