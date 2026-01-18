import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { PitlaneTabs } from '@/components/pitlane/pitlane-tabs'
import { Search } from 'lucide-react'

export const revalidate = 300

export default async function PitlanePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase public env vars are missing for pitlane page')
    notFound()
  }

  const supabase = createClient(supabaseUrl!, supabaseKey!)
  const nowIso = new Date().toISOString()

  const [tracksWithDates, drivers, teams, tracks] = await Promise.all([
    supabase
      .from('tracks')
      .select('id, name, image_url, location, country, start_date, race_day_date, circuit_ref')
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true }),
    supabase
      .from('drivers')
      .select('id, name, headshot_url, image_url, nationality')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('teams')
      .select('id, name, image_url')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('tracks')
      .select('id, name, image_url, location, country')
      .order('name', { ascending: true }),
  ])

  const tracksWithStartDate = tracksWithDates.data || []
  const driversData = drivers.data || []
  const teamsData = teams.data || []
  const tracksData = tracks.data || []

  const nextRace = getClosestRace({ tracks: tracksWithStartDate })
  const backgroundImage = nextRace?.image_url || '/images/race_banner.png'
  
  // Format dates in short format
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const startDateFormatted = formatShortDate(nextRace?.start_date || null)
  const raceDayDateFormatted = formatShortDate(nextRace?.race_day_date || null)
  
  // Build date display string
  let dateDisplay = 'Date TBA'
  if (startDateFormatted && raceDayDateFormatted) {
    dateDisplay = `${startDateFormatted}`
  } else if (startDateFormatted) {
    dateDisplay = `Start: ${startDateFormatted}`
  } else if (raceDayDateFormatted) {
    dateDisplay = `Race Day: ${raceDayDateFormatted}`
  }
  
  // Calculate counter
  let counterText = ''
  if (nextRace?.start_date) {
    const raceTime = new Date(nextRace.start_date)
    const now = new Date()
    const timeUntilRace = raceTime.getTime() - now.getTime()
    if (timeUntilRace > 0) {
      const daysUntil = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24))
      const hoursUntil = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      counterText = `${daysUntil > 0 ? `${daysUntil} day${daysUntil > 1 ? 's' : ''} ` : ''}${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Less than an hour'} until race start`
    }
  }
  
  // Check if it's race day
  const isRaceDay = (() => {
    if (!nextRace?.race_day_date) return false
    const today = new Date()
    const raceDay = new Date(nextRace.race_day_date)
    // Compare dates only (ignore time)
    return (
      today.getFullYear() === raceDay.getFullYear() &&
      today.getMonth() === raceDay.getMonth() &&
      today.getDate() === raceDay.getDate()
    )
  })()
  
  // Determine link destination
  const trackSlug = nextRace ? slugify(nextRace.name) : ''
  const bannerHref = isRaceDay ? '#' : `/tracks/${trackSlug}` // TODO: Replace '#' with live chat when implemented

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header + Search */}
      <div className="space-y-3 px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#838383]" />
          <input
            type="search"
            placeholder="Search pit lane"
            className="w-full rounded-full bg-[#1D1D1D] px-10 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

     {/* Upcoming race banner */}
      {nextRace ? (
        <div className="">
          <sup className="w-full text-left block text-xs text-gray-500 px-4 sm:px-6 lg:px-8">Upcoming Race</sup>
        <Link
          href={bannerHref}
          className="block overflow-hidden mx-4 sm:mx-6 lg:mx-8 hover:opacity-90 rounded-sm"
          style={{
            boxShadow: '0 0 20px rgba(255, 0, 110, 0.6), 0 0 10px rgba(253, 53, 50, 0.5), 0 0 25px rgba(253, 99, 0, 0.4), 0 0 0 .5px rgba(255, 0, 110, 0.4)',
          }}
        >
          <section className="relative h-[90px] w-full cursor-pointer">
            <Image
              src={backgroundImage}
              alt={nextRace.circuit_ref || nextRace.name}
              fill
              priority
              sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1152px"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
            
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="px-2 sm:px-10 text-white space-y-0 pt-2">
                <div className="flex items-center gap-2">
                  {nextRace.country ? (
                    <span className="text-xl leading-none">
                      {getCountryFlag(nextRace.country)}
                    </span>
                  ) : null}
                  <h2 className="font-display tracking-wider text-lg">{nextRace.circuit_ref || nextRace.name}</h2>
                </div>
                <p className="text-xs text-gray-300 tracking-wide pl-7">
                  {dateDisplay}
                  {nextRace.location ? ` - ${nextRace.location}` : ''}
                  {nextRace.country ? `, ${nextRace.country}` : ''}
                </p>
              </div>
              {counterText && (
                <div className="w-full text-right pb-2 pr-4">
                  <p className="text-xs text-white/90 tracking-wide">
                    {counterText}
                  </p>
                </div>
              )}
            </div>
            </section>
          </Link>
        </div>
      ) : (
        <section className="bg-[#FFFFFF33] h-[80px] text-center shadow-sm flex flex-col items-center justify-center mx-4 sm:mx-6 lg:mx-8">
          <p className="text-white font-semibold">No upcoming race scheduled yet.</p>
          <p className="text-white/50 text-sm mt-2">Check back soon for the next race details.</p>
        </section>
      )}

      {/* Tabs for drivers/teams/tracks */}
      <div className="px-4 sm:px-6 lg:px-8">
        <PitlaneTabs drivers={driversData} teams={teamsData} tracks={tracksData} />
      </div>

      {/* Beginners guide banner */}
      <section>
        <sup className="w-full text-left block text-xs text-gray-500 px-4 sm:px-6 lg:px-8">Beginner's Guide</sup>
        <Link
          href="/beginners-guide"
          className="block relative overflow-hidden text-white shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/images/beginners.png"
              alt="Beginners guide"
              fill
              sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1152px"
              className="object-cover"
            />
          </div>
          <div className="relative px-6 py-10 sm:px-10 space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-xl">New to F1?</p>
            <p className="max-w-2xl text-white">
              Learn the essentials of Formula 1, the teams, drivers, and the racing calendar before
              you dive into the action.
            </p>
            <span className="inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white">
              Read the guide
            </span>
          </div>
        </Link>
      </section>
    </div>
  )
}

function getClosestRace(params: { tracks: Array<{ start_date: string | null } & Record<string, any>> }) {
  const { tracks } = params
  if (tracks.length === 0) return null

  const now = new Date()
  const graceMs = 24 * 60 * 60 * 1000
  const nowPlusGrace = new Date(now.getTime() + graceMs)

  const eligible = tracks.filter((track) => {
    if (!track.start_date) return false
    return new Date(track.start_date) <= nowPlusGrace
  })

  if (eligible.length > 0) {
    return eligible.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return bTime - aTime
    })[0]
  }

  return tracks.sort((a, b) => {
    const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
    const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
    return aTime - bTime
  })[0]
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
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
    'saudi arabia': '🇸🇦',
    singapore: '🇸🇬',
    spain: '🇪🇸',
    uk: '🇬🇧',
    'united kingdom': '🇬🇧',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    abu_dhabi: '🇦🇪',
    'abu dhabi': '🇦🇪',
    uae: '🇦🇪',
    'united arab emirates': '🇦🇪',
    azerbaijan: '🇦🇿',
  }
  return flags[normalized] || ''
}
