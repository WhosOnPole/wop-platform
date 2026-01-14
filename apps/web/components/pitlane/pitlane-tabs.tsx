'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
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
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6">
        <div className="flex gap-2 py-3 text-sm font-semibold text-gray-600">
          <TabButton label="Drivers" active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} />
          <TabButton label="Teams" active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} />
          <TabButton label="Tracks" active={activeTab === 'tracks'} onClick={() => setActiveTab('tracks')} />
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Nothing to show yet. Check back soon.
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
                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Avatar src={imageSrc} alt={driver.name} fallback={driver.name.charAt(0)} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                        {driver.name}
                      </p>
                      <p className="text-xs text-gray-500">Driver</p>
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
                    className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Avatar src={team.image_url} alt={team.name} fallback={team.name.charAt(0)} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                        {team.name}
                      </p>
                      <p className="text-xs text-gray-500">Team</p>
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
                  className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Avatar src={track.image_url} alt={track.name} fallback={track.name.charAt(0)} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                      {track.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {[track.location, track.country].filter(Boolean).join(', ')}
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
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
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
    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
      {src ? (
        <Image src={src} alt={alt} fill sizes="48px" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
          {fallback}
        </div>
      )}
    </div>
  )
}
