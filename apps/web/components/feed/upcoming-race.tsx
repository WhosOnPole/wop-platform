import Link from 'next/link'
import Image from 'next/image'

interface Race {
  id: string
  name: string
  slug: string
  start_date: string | null
  race_day_date: string | null
  location: string | null
  country: string | null
  image_url: string | null
  circuit_ref: string | null
  chat_enabled?: boolean
}

interface UpcomingRaceProps {
  race: Race
}

export function UpcomingRace({ race }: UpcomingRaceProps) {
  if (!race.start_date) return null

  const raceTime = new Date(race.start_date)
  const now = new Date()
  const timeUntilRace = raceTime.getTime() - now.getTime()
  const daysUntil = Math.floor(timeUntilRace / (1000 * 60 * 60 * 24))
  const hoursUntil = Math.floor((timeUntilRace % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  // Check if race is live (within race weekend window)
  const isLive = (() => {
    if (!race.start_date || !race.race_day_date) return false
    if (race.chat_enabled === false) return false
    
    const start = new Date(race.start_date)
    const raceDay = new Date(race.race_day_date)
    const end = new Date(raceDay.getTime() + 24 * 60 * 60 * 1000) // +24 hours
    
    return now >= start && now <= end
  })()

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
    dateDisplay = `Start: ${startDateFormatted} • Race Day: ${raceDayDateFormatted}`
  } else if (startDateFormatted) {
    dateDisplay = `Start: ${startDateFormatted}`
  } else if (raceDayDateFormatted) {
    dateDisplay = `Race Day: ${raceDayDateFormatted}`
  }

  // Build counter text
  let counterText = ''
  if (timeUntilRace > 0) {
    counterText = `${daysUntil > 0 ? `${daysUntil} day${daysUntil > 1 ? 's' : ''} ` : ''}${hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Less than an hour'} until race start`
  }

  const backgroundImage = race.image_url || '/images/race_banner.png'
  const trackSlug = race.slug
  // When live, link to race page (which shows chat). Otherwise link to track page.
  const bannerHref = isLive ? `/race/${trackSlug}` : `/tracks/${trackSlug}`

  return (
    <div className="overflow-hidden rounded-lg relative" style={{
      boxShadow: '0 0 15px rgba(255, 0, 110, 0.6), 0 0 25px rgba(253, 53, 50, 0.5), 0 0 35px rgba(253, 99, 0, 0.4), 0 0 0 2px rgba(255, 0, 110, 0.4)',
    }}>
      <Link
        href={bannerHref}
        className="block hover:opacity-90 transition-opacity"
      >
        <section className="relative w-full cursor-pointer" style={{ minHeight: '140px' }}>
          <Image
            src={backgroundImage}
            alt={race.circuit_ref || race.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-center">
            <div className="px-6 py-4 text-white space-y-2">
              <h2 className="font-display tracking-wider text-lg">{race.circuit_ref || race.name}</h2>
              <p className="text-sm text-white/90">
                {dateDisplay}
                {race.location ? ` • ${race.location}` : ''}
                {race.country ? `, ${race.country}` : ''}
              </p>
              {counterText && (
                <p className="text-sm font-medium text-white/95 mt-2">
                  {counterText}
                </p>
              )}
            </div>
          </div>
        </section>
      </Link>
    </div>
  )
}

