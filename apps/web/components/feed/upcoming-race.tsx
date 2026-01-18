import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface Race {
  id: string
  name: string
  slug: string
  start_date: string | null
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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Race</h2>
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">{race.name}</h3>
      <p className="mb-4 text-sm text-gray-600">
        {raceTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      {timeUntilRace > 0 && (
        <p className="mb-4 text-sm font-medium text-blue-600">
          {daysUntil > 0 ? `${daysUntil} day${daysUntil > 1 ? 's' : ''} ` : ''}
          {hoursUntil > 0 ? `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}` : 'Less than an hour'}{' '}
          until race start
        </p>
      )}
      <Link
        href={`/race/${race.slug}`}
        className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
      >
        View Race Page
      </Link>
    </div>
  )
}

