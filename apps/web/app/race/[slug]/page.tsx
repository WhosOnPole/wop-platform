import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { RealtimeChatBatched } from '@/components/race/realtime-chat-batched'
import { AdminChatControl } from '@/components/race/admin-chat-control'
import { getChatStatus } from '@/utils/race-weekend'

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

  // Live = chat is open or read_only (active track event window)
  const chatStatus = await getChatStatus(race.id, supabase)
  const chatActive = chatStatus.mode === 'open' || chatStatus.mode === 'read_only'
  const opensAt = chatStatus.opens_at ? new Date(chatStatus.opens_at) : null
  const isUpcoming = opensAt ? opensAt > new Date() : false

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

  // When live (active track event): full-screen chat_bg, no scroll, header + styled chat box
  if (chatActive) {
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
          RACEtalk: {race.location} - {race.country}
          </h1>
          <p className="text-sm text-white/90">{race.name}</p>

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

      {isUpcoming && opensAt ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
          <p className="text-gray-600">
            Chat will be available when the session starts. Check back on{' '}
            {opensAt.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
            !
          </p>
        </div>
      ) : chatStatus.reason ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow">
          <p className="text-gray-600">{chatStatus.reason}</p>
        </div>
      ) : null}
    </div>
  )
}

