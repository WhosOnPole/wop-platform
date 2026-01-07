import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Radio, Calendar, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function LiveChatPage() {
  const supabase = createServerComponentClient(
    { cookies: () => cookies() },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  const now = new Date()
  const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Fetch all races
  const { data: allRaces } = await supabase
    .from('race_schedule')
    .select('*')
    .order('race_time', { ascending: true })

  if (!allRaces) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-gray-500">No races scheduled.</p>
      </div>
    )
  }

  // Categorize races
  const liveRaces = allRaces.filter((race) => {
    if (!race.race_time) return false
    const raceTime = new Date(race.race_time)
    const raceEndTime = new Date(raceTime.getTime() + 3 * 60 * 60 * 1000)
    return now >= raceTime && now <= raceEndTime
  })

  const upcomingRaces = allRaces.filter((race) => {
    if (!race.race_time) return false
    return new Date(race.race_time) > now
  })

  const recentRaces = allRaces.filter((race) => {
    if (!race.race_time) return false
    const raceTime = new Date(race.race_time)
    return raceTime < now && raceTime >= sevenDaysAgo
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Live Chat</h1>
        <p className="mt-2 text-gray-600">
          Join the conversation during live races and connect with F1 fans worldwide
        </p>
      </div>

      {/* Currently Live Races */}
      {liveRaces.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center space-x-2">
            <Radio className="h-6 w-6 animate-pulse text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Currently Live</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveRaces.map((race) => (
              <Link
                key={race.id}
                href={`/race/${race.slug}`}
                className="group overflow-hidden rounded-lg border-2 border-red-500 bg-gradient-to-br from-red-50 to-red-100 p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-2 flex items-center space-x-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
                  <span className="text-sm font-bold text-red-700">LIVE NOW</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-red-700">
                  {race.name}
                </h3>
                {race.race_time && (
                  <p className="text-sm text-gray-600">
                    Started {new Date(race.race_time).toLocaleString()}
                  </p>
                )}
                <div className="mt-4 rounded-md bg-red-600 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-red-700">
                  Join Live Chat →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Races */}
      {upcomingRaces.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Upcoming Races</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingRaces.map((race) => {
              const raceTime = race.race_time ? new Date(race.race_time) : null
              const timeUntil = raceTime ? raceTime.getTime() - now.getTime() : null
              const daysUntil = timeUntil ? Math.floor(timeUntil / (1000 * 60 * 60 * 24)) : null
              const hoursUntil = timeUntil
                ? Math.floor((timeUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                : null

              return (
                <Link
                  key={race.id}
                  href={`/race/${race.slug}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow hover:shadow-lg transition-shadow"
                >
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {race.name}
                  </h3>
                  {raceTime && (
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{raceTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      <p>{raceTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      {daysUntil !== null && hoursUntil !== null && (
                        <div className="mt-2 flex items-center space-x-1 text-blue-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {daysUntil > 0 ? `${daysUntil}d ` : ''}
                            {hoursUntil > 0 ? `${hoursUntil}h` : 'Less than 1h'} until start
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-blue-700">
                    View Race Page →
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent Races */}
      {recentRaces.length > 0 && (
        <section>
          <div className="mb-6 flex items-center space-x-2">
            <Clock className="h-6 w-6 text-gray-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Recent Races</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentRaces.map((race) => (
              <Link
                key={race.id}
                href={`/race/${race.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {race.name}
                </h3>
                {race.race_time && (
                  <p className="text-sm text-gray-600">
                    {new Date(race.race_time).toLocaleDateString()}
                  </p>
                )}
                <div className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 group-hover:bg-gray-50">
                  View Chat Archive →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {liveRaces.length === 0 && upcomingRaces.length === 0 && recentRaces.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <Radio className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No races scheduled at this time.</p>
        </div>
      )}
    </div>
  )
}

