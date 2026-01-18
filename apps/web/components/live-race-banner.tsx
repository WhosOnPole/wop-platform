'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import Link from 'next/link'
import { Radio } from 'lucide-react'

interface LiveRace {
  id: string
  name: string
  slug: string
  start_date: string
}

export function LiveRaceBanner() {
  const supabase = createClientComponentClient()
  const [liveRace, setLiveRace] = useState<LiveRace | null>(null)

  useEffect(() => {
    checkForLiveRace()

    // Check every minute for live races
    const interval = setInterval(checkForLiveRace, 60000)

    return () => clearInterval(interval)
  }, [])

  async function checkForLiveRace() {
    const now = new Date()
    const graceMs = 24 * 60 * 60 * 1000

    const { data: races } = await supabase
      .from('tracks')
      .select('id, name, start_date')
      .not('start_date', 'is', null)
      .lte('start_date', now.toISOString())
      .order('start_date', { ascending: false })
      .limit(1)

    if (races && races.length > 0) {
      const race = races[0]
      const raceTime = new Date(race.start_date)
      const raceEndTime = new Date(raceTime.getTime() + graceMs)

      if (now >= raceTime && now <= raceEndTime) {
        setLiveRace({
          id: race.id,
          name: race.name,
          slug: slugify(race.name),
          start_date: race.start_date,
        })
        return
      }
    }

    setLiveRace(null)
  }

  if (!liveRace) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <Radio className="h-5 w-5 animate-pulse text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              The {liveRace.name} is live!
            </p>
            <p className="text-xs text-red-100">Join the chat now</p>
          </div>
        </div>
        <Link
          href={`/race/${liveRace.slug}`}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Join Live Chat
        </Link>
      </div>
    </div>
  )
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}
