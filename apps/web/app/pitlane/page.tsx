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

  const [upcomingRace, drivers, teams, tracks] = await Promise.all([
    supabase
      .from('race_schedule')
      .select(
        `
        id,
        name,
        slug,
        race_time,
        location,
        country,
        track:tracks!track_id (
          id,
          name,
          image_url,
          country,
          location,
          flag_url
        )
      `
      )
      .gte('race_time', nowIso)
      .order('race_time', { ascending: true })
      .limit(1)
      .maybeSingle(),
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

  const nextRace = upcomingRace.data || null
  const driversData = drivers.data || []
  const teamsData = teams.data || []
  const tracksData = tracks.data || []

  const raceTrack = Array.isArray(nextRace?.track) ? nextRace?.track?.[0] : nextRace?.track
  const backgroundImage = raceTrack?.image_url || '/images/backsplash.png'
  const raceDate =
    nextRace?.race_time &&
    new Date(nextRace.race_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header + Search */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search the pitlane"
            className="w-full rounded-full bg-white bg-opacity-20 px-10 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* Upcoming race banner */}
      {nextRace ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
          <div className="relative h-[80px] w-full">
            <Image
              src={backgroundImage}
              alt={raceTrack?.name || nextRace.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-10 text-white space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">Upcoming Race</p>
              <h2 className="text-2xl sm:text-3xl font-bold">{nextRace.name}</h2>
                <p className="text-sm sm:text-base text-white/90">
                  {raceDate || 'Date TBA'}
                  {nextRace.location ? ` • ${nextRace.location}` : ''}
                  {nextRace.country ? `, ${nextRace.country}` : ''}
                </p>
                <Link
                  href={`/race/${nextRace.slug}`}
                  className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100"
                >
                  View race page
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-200 bg-white h-[80px] text-center shadow-sm flex flex-col items-center justify-center">
          <p className="text-gray-700 font-semibold">No upcoming race scheduled yet.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for the next race details.</p>
        </section>
      )}

      {/* Tabs for drivers/teams/tracks */}
      <PitlaneTabs drivers={driversData} teams={teamsData} tracks={tracksData} />

      {/* Beginners guide banner */}
      <section>
        <sup className="w-full text-left block text-xs text-gray-500">Beginner's Guide</sup>
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-[#ff7452] via-[#ff9a76] to-[#ffd166] text-white shadow-lg">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/images/backsplash.png"
              alt="Beginners guide"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="relative px-6 py-10 sm:px-10 space-y-3">
            <p className="text-sm uppercase tracking-[0.2em]">New to F1?</p>
            <h3 className="text-2xl sm:text-3xl font-bold">Start with our Beginner&apos;s Guide</h3>
            <p className="max-w-2xl text-sm sm:text-base text-white/90">
              Learn the essentials of Formula 1, the teams, drivers, and the racing calendar before
              you dive into the action.
            </p>
            <Link
              href="/beginners-guide"
              className="inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-gray-900 shadow hover:bg-white"
            >
              Read the guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
