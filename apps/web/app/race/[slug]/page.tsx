import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Calendar, MapPin, Users } from 'lucide-react'
import { CheckInSection } from '@/components/race/check-in-section'
import { LiveChatComponent } from '@/components/race/live-chat-component'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function RacePage({ params }: PageProps) {
  const { slug } = await params
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: async() => cookieStore })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Fetch race
  const { data: race } = await supabase
    .from('race_schedule')
    .select(
      `
      *,
      track:tracks!track_id (
        id,
        name,
        image_url
      )
    `
    )
    .eq('slug', slug)
    .single()

  if (!race) {
    notFound()
  }

  const raceTime = race.race_time ? new Date(race.race_time) : null
  const now = new Date()
  const isLive = raceTime
    ? now >= raceTime && now <= new Date(raceTime.getTime() + 3 * 60 * 60 * 1000)
    : false
  const isUpcoming = raceTime ? raceTime > now : false
  const isPast = raceTime ? raceTime < now : false

  // Fetch check-ins
  const { data: checkIns } = await supabase
    .from('race_checkins')
    .select(
      `
      *,
      user:profiles!user_id (
        id,
        username,
        profile_image_url
      )
    `
    )
    .eq('race_id', race.id)
    .order('created_at', { ascending: false })

  // Check if current user has checked in
  let userCheckIn = null
  if (session) {
    const { data } = await supabase
      .from('race_checkins')
      .select('*')
      .eq('race_id', race.id)
      .eq('user_id', session.user.id)
      .single()

    userCheckIn = data
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Race Header */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-lg">
        {race.track?.image_url && (
          <div className="relative h-64 w-full">
            <img
              src={race.track.image_url}
              alt={race.name}
              className="h-full w-full object-cover"
            />
            {isLive && (
              <div className="absolute top-4 right-4 flex items-center space-x-2 rounded-full bg-red-600 px-4 py-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                <span className="text-sm font-bold text-white">LIVE</span>
              </div>
            )}
          </div>
        )}
        <div className="p-8">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">{race.name}</h1>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {race.track && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{race.track.name}</span>
              </div>
            )}
            {raceTime && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">
                  {raceTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            {raceTime && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">
                  {raceTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Section */}
      {session && (
        <CheckInSection
          raceId={race.id}
          raceName={race.name}
          userCheckIn={userCheckIn}
          checkIns={checkIns || []}
        />
      )}

      {/* Live Chat Section */}
      {isLive || isPast ? (
        <LiveChatComponent raceId={race.id} raceTime={raceTime} />
      ) : isUpcoming ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
          <p className="text-gray-600">
            Chat will be available when the race starts. Check back on{' '}
            {raceTime?.toLocaleDateString()}!
          </p>
        </div>
      ) : null}
    </div>
  )
}

