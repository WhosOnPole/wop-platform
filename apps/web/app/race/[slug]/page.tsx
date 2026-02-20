import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { RealtimeChatBatched } from '@/components/race/realtime-chat-batched'
import { AdminChatControl } from '@/components/race/admin-chat-control'
import { isRaceWeekendActive } from '@/utils/race-weekend'

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
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const slugName = slug.replace(/-/g, ' ')
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name, location, country, start_date, end_date, chat_enabled')
    .ilike('name', `%${slugName}%`)

  const race = tracks?.find(
    (track) => track.name.toLowerCase().replace(/\\s+/g, '-') === slug
  ) || tracks?.[0]

  if (!race) {
    notFound()
  }

  const raceTime = race.start_date ? new Date(race.start_date) : null
  const now = new Date()
  const graceMs = 24 * 60 * 60 * 1000
  const isLive = raceTime
    ? now >= raceTime && now <= new Date(raceTime.getTime() + graceMs)
    : false
  const isUpcoming = raceTime ? raceTime > now : false
  const isPast = raceTime ? raceTime < now : false

  // Check if race weekend is active (using utility function)
  const raceWeekendActive = isRaceWeekendActive(race)

  // Check if user is admin
  let isAdmin = false
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .single()

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'
    isAdmin = isAdminEmail || isAdminRole || false
  }

  // When live: full-screen chat_bg, no scroll, header + styled chat box
  if (raceWeekendActive) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">
        {/* Full viewport background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/chat_bg.png)' }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 py-6 sm:px-6 lg:px-8 pt-16">
          {/* Top header outside race chat */}
          <h1 className="font-display text-2xl tracking-wider text-white sm:text-3xl shrink-0">
            {race.name} RACEtalk
          </h1>

          {/* Admin above chat (when admin) */}
          {isAdmin && (
            <div className="mt-4 shrink-0">
              <AdminChatControl
                trackId={race.id}
                initialChatEnabled={race.chat_enabled !== false}
              />
            </div>
          )}

          {/* Race chat in styled container */}
          <div
            className="mt-4 flex-1 min-h-0 flex flex-col rounded-[20px] overflow-hidden"
            style={{
              border: '1px solid #525252',
              background: 'rgba(0, 0, 0, 0.40)',
            }}
          >
            <RealtimeChatBatched
              trackId={race.id}
              raceName={race.name}
              liveLayout
            />
          </div>
        </div>
      </div>
    )
  }

  // Not live: standard scrollable page
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Admin Chat Control */}
      {isAdmin && (
        <div className="mb-6">
          <AdminChatControl
            trackId={race.id}
            initialChatEnabled={race.chat_enabled !== false}
          />
        </div>
      )}

      {isUpcoming ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
          <p className="text-gray-600">
            Chat will be available when the race weekend starts. Check back on{' '}
            {raceTime?.toLocaleDateString()}!
          </p>
        </div>
      ) : null}
    </div>
  )
}

