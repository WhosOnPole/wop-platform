import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RealtimeChatBatched } from '@/components/race/realtime-chat-batched'
import { getChatStatus } from '@/utils/race-weekend'
import { getRaceSlug, resolveTrackFromRaceSlug } from '@/utils/race-slug'

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

  const race = await resolveTrackFromRaceSlug(supabase, slug)

  if (!race) {
    notFound()
  }

  // Live = chat is open or read_only (active track event window)
  const chatStatus = await getChatStatus(race.id, supabase)
  const chatActive = chatStatus.mode === 'open' || chatStatus.mode === 'read_only'
  const opensAt = chatStatus.opens_at ? new Date(chatStatus.opens_at) : null
  const isUpcoming = opensAt ? opensAt > new Date() : false
  const trackSlug = getRaceSlug(race)

  // When live (active track event): full-screen chat_bg, no scroll, header + styled chat box
  if (chatActive) {
    return (
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-black pt-[calc(1.75rem+env(safe-area-inset-top))]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/chat_bg.png)' }}
          aria-hidden
        />
        <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 py-6 sm:px-6 lg:px-8 pt-16">
          <h1 className="font-display text-2xl tracking-wider text-white sm:text-3xl shrink-0">
          RACEtalk: {race.location} - {race.country}
          </h1>
          <Link
            href={`/tracks/${trackSlug}`}
            className="inline-flex items-center gap-1 text-sm text-white/90 transition-colors hover:text-white"
          >
            {race.name} <span aria-hidden>→</span>
          </Link>

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
