import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { PitlaneSearchProvider, PitlaneTabsComponent } from '@/components/pitlane/pitlane-search-wrapper'
import { UpcomingRaceBannerActions } from '@/components/pitlane/upcoming-race-banner-actions'

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
      .select('id, name, image_url, location, country, start_date, race_day_date, circuit_ref, chat_enabled')
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
  
  // Format dates in short format (e.g., "Mar. 6")
  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
  
  const raceDayDateFormatted = formatShortDate(nextRace?.race_day_date || null)
  
  // Build date display string: "Mar. 6 - Track Name"
  let dateDisplay = 'Date TBA'
  const trackName = nextRace?.name || nextRace?.location || nextRace?.country
  const startDateFormatted =
    raceDayDateFormatted || (nextRace?.start_date ? formatShortDate(nextRace.start_date) : null)
  if (startDateFormatted && trackName) {
    dateDisplay = `${startDateFormatted} - ${trackName}`
  } else if (startDateFormatted) {
    dateDisplay = startDateFormatted
  }
  
  // Calculate counter - countdown to race day
  let counterText = ''
  if (nextRace?.race_day_date) {
    const raceTime = new Date(nextRace.race_day_date)
    const now = new Date()
    const timeUntilRace = raceTime.getTime() - now.getTime()
    if (timeUntilRace > 0) {
      const daysUntil = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24))
      const hoursUntil = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      counterText = `${daysUntil > 0 ? `${daysUntil} day${daysUntil > 1 ? 's' : ''} ` : ''}${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Less than an hour'} until race start`
    }
  } else if (nextRace?.start_date) {
    // Fallback to start_date if race_day_date not available
    const raceTime = new Date(nextRace.start_date)
    const now = new Date()
    const timeUntilRace = raceTime.getTime() - now.getTime()
    if (timeUntilRace > 0) {
      const daysUntil = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24))
      const hoursUntil = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      counterText = `${daysUntil > 0 ? `${daysUntil} day${daysUntil > 1 ? 's' : ''} ` : ''}${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Less than an hour'} until race start`
    }
  }
  
  // Check if race weekend is live (within active window)
  const isLive = (() => {
    if (!nextRace?.start_date || !nextRace?.race_day_date) return false
    if (nextRace.chat_enabled === false) return false
    
    const now = new Date()
    const start = new Date(nextRace.start_date)
    const raceDay = new Date(nextRace.race_day_date)
    const end = new Date(raceDay.getTime() + 24 * 60 * 60 * 1000) // +24 hours
    
    return now >= start && now <= end
  })()
  
  // Determine link destination
  const trackSlug = nextRace ? slugify(nextRace.name) : ''
  // When live, link to race page (which shows chat). Otherwise link to track page.
  const bannerHref = isLive ? `/race/${trackSlug}` : `/tracks/${trackSlug}`

  return (
    <PitlaneSearchProvider>
      <div className="mx-auto max-w- pt-4 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-white font-display">Pitlane</h1>
        <h3 className="text-sm text-white/70 font-sans mb-6">Tap into the Grid. Stay ahead of the pack.</h3>
      </div>
      <div className="mx-auto max-w-6xl mt-6">
      {/* Upcoming race banner */}
      {nextRace ? (
        <div className="mb-5 relative mx-4 mb-8 sm:mx-6 lg:mx-8">
          <sup className="w-full text-left block text-xs text-[#838383]">Upcoming</sup>
        <Link
          href={bannerHref}
          className="block overflow-hidden hover:opacity-90"
          style={
            isLive
              ? {
                  boxShadow:
                    '0 0 20px rgba(255, 0, 110, 0.6), 0 0 5px rgba(253, 53, 50, 0.5), 0 0 15px rgba(253, 99, 0, 0.4), 0 0 0 .5px rgba(255, 0, 110, 0.4)',
                }
              : undefined
          }
        >
          <section className="relative h-[80px] w-full cursor-pointer">
            <Image
              src={backgroundImage}
              alt={nextRace.circuit_ref || nextRace.name}
              fill
              priority
              sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1024px) calc(100vw - 3rem), 1152px"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
            
            {/* Action Buttons - Top Right */}
            <UpcomingRaceBannerActions
              trackId={nextRace.id}
              trackSlug={trackSlug}
              isLive={isLive}
            />
            
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="px-2 sm:px-10 text-white pt-2">
                {/* Grand Prix Name with Flag - Same line */}
                <div className="flex items-center gap-2">
                  {nextRace.country && getCountryFlagPath(nextRace.country) ? (
                    <Image
                      src={getCountryFlagPath(nextRace.country)!}
                      alt={nextRace.country}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  ) : null}
                  <h2 className="font-display tracking-wider text-lg">
                    {nextRace.circuit_ref || nextRace.name}
                  </h2>
                </div>
                {/* Date - City, Country - Below name, aligned with name start */}
                <p className="text-[10px] text-gray-300 tracking-wide pl-7">
                  {dateDisplay}
                </p>
                {counterText && (
                  <p className="text-[10px] text-white/90 tracking-wide pl-7">
                    {counterText}
                  </p>
                )}
              </div>
              
            </div>
            </section>
          </Link>
          
        </div>
      ) : (
        <section className="bg-[#FFFFFF33] h-[80px] text-center shadow-sm flex flex-col items-center justify-center mb-12">
          <p className="text-white font-semibold">No upcoming race scheduled yet.</p>
          <p className="text-white/50 text-sm mt-2">Check back soon for the next race details.</p>
        </section>
      )}

      {/* Tabs for drivers/teams/tracks/schedule */}
      <PitlaneTabsComponent
        drivers={driversData}
        teams={teamsData}
        tracks={tracksData}
        schedule={tracksWithStartDate}
        supabaseUrl={supabaseUrl}
      />

      {/* Beginners guide banner */}
      <section>

        <Link
          href="/beginners-guide"
          className="block relative overflow-hidden text-white shadow-lg hover:opacity-90 transition-opacity cursor-pointer mt-1"
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
          </div>
        </Link>
      </section>
      </div>
    </PitlaneSearchProvider>
  )
}

function getClosestRace(params: { tracks: Array<{ start_date: string | null; race_day_date?: string | null; chat_enabled?: boolean } & Record<string, any>> }) {
  const { tracks } = params
  if (tracks.length === 0) return null

  const now = new Date()
  const graceMs = 24 * 60 * 60 * 1000

  // First, find live races (within race weekend window)
  const liveRaces = tracks.filter((track) => {
    if (!track.start_date || !track.race_day_date) return false
    if (track.chat_enabled === false) return false
    
    const start = new Date(track.start_date)
    const raceDay = new Date(track.race_day_date)
    const end = new Date(raceDay.getTime() + graceMs)
    
    return now >= start && now <= end
  })

  // If we have a live race, return it
  if (liveRaces.length > 0) {
    return liveRaces.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return bTime - aTime // Most recent first
    })[0]
  }

  // Otherwise, find the next upcoming race
  const upcomingRaces = tracks.filter((track) => {
    if (!track.start_date) return false
    return new Date(track.start_date) > now
  })

  if (upcomingRaces.length > 0) {
    return upcomingRaces.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return aTime - bTime // Earliest first
    })[0]
  }

  // Fallback: return the most recent past race
  return tracks.sort((a, b) => {
    const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
    const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
    return bTime - aTime
  })[0]
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
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
