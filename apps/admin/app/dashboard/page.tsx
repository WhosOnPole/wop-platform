import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import {
  ArrowUpRight,
  FileText,
  Flag,
  Gauge,
  MessageSquare,
  PencilLine,
  Star,
} from 'lucide-react'
import { RaceWeekendWidget } from '@/components/dashboard/race-weekend-widget'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Get scheduled races (include timezone for start/end time display)
  const { data: scheduledRaces } = await supabase
    .from('tracks')
    .select('id, name, location, start_date, end_date, timezone, chat_enabled')
    .not('start_date', 'is', null)
    .order('start_date', { ascending: true })

  // Source of truth for "live" status should match app experience:
  // active track_events windows via RPC.
  const [{ data: liveTrackIds }, { data: nextUpcomingTrackId }] = await Promise.all([
    supabase.rpc('get_track_ids_with_active_event'),
    supabase.rpc('get_track_id_with_next_upcoming_event'),
  ])

  const raceList = scheduledRaces || []
  const liveIdSet = new Set((liveTrackIds || []) as string[])
  const liveRace = raceList.find((race) => liveIdSet.has(race.id)) || null

  const rpcUpcomingRace =
    typeof nextUpcomingTrackId === 'string'
      ? raceList.find((race) => race.id === nextUpcomingTrackId) || null
      : null

  const fallbackUpcomingRace = getClosestUpcomingRace(raceList)

  const currentRace = liveRace || rpcUpcomingRace || fallbackUpcomingRace
  const currentRaceStatus: 'live' | 'upcoming' | null = liveRace
    ? 'live'
    : currentRace
      ? 'upcoming'
      : null

  // Get chat metrics for current race
  let metrics = null
  if (currentRace?.id) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const [
      { count: totalMessages },
      { data: messages },
      { count: recentMessages },
    ] = await Promise.all([
      supabase
        .from('live_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', currentRace.id)
        .is('deleted_at', null),
      supabase
        .from('live_chat_messages')
        .select('user_id')
        .eq('track_id', currentRace.id)
        .is('deleted_at', null),
      supabase
        .from('live_chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', currentRace.id)
        .is('deleted_at', null)
        .gte('created_at', oneHourAgo),
    ])

    const uniqueUsers = new Set(messages?.map((m) => m.user_id) || []).size
    const messagesPerMinute = recentMessages ? Math.round(recentMessages / 60) : 0

    metrics = {
      totalMessages: totalMessages || 0,
      activeUsers: uniqueUsers,
      messagesPerMinute,
    }
  }

  // Get counts for dashboard stats
  const [
    pendingReports,
    pendingTips,
    pendingStories,
    recentNews,
    recentArticles,
  ] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('track_tips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('user_story_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    supabase
      .from('news_stories')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('articles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ])

  const stats = [
    {
      name: 'Pending Reports',
      value: pendingReports.count || 0,
      icon: Flag,
      href: '/dashboard/reports',
      accent: 'border-l-red-500',
      iconClassName: 'bg-red-50 text-red-600',
      badgeClassName: 'bg-red-100 text-red-800',
      priority: 'Urgent',
    },
    {
      name: 'Pending Track Tips',
      value: pendingTips.count || 0,
      icon: MessageSquare,
      href: '/dashboard/track-tips',
      accent: 'border-l-amber-400',
      iconClassName: 'bg-amber-50 text-amber-600',
      badgeClassName: 'bg-amber-100 text-amber-800',
      priority: 'Review',
    },
    {
      name: 'Pending User Stories',
      value: pendingStories.count || 0,
      icon: FileText,
      href: '/dashboard/content?tab=stories',
      accent: 'border-l-[#25B4B1]',
      iconClassName: 'bg-teal-50 text-[#25B4B1]',
      badgeClassName: 'bg-teal-100 text-teal-800',
      priority: 'Review',
    },
    {
      name: 'Published Stories',
      value: recentNews.count || 0,
      icon: FileText,
      href: '/dashboard/content',
      accent: 'border-l-blue-500',
      iconClassName: 'bg-blue-50 text-blue-600',
      badgeClassName: 'bg-blue-100 text-blue-800',
      priority: 'Content',
    },
    {
      name: 'Published Articles',
      value: recentArticles.count || 0,
      icon: FileText,
      href: '/dashboard/content',
      accent: 'border-l-[#25B4B1]',
      iconClassName: 'bg-teal-50 text-[#25B4B1]',
      badgeClassName: 'bg-teal-100 text-teal-800',
      priority: 'Content',
    },
  ]

  const quickActions = [
    {
      href: '/dashboard/data-enrichment',
      title: 'Enrich Driver, Team, Track Data',
      description: 'Add imagery, bios, schedules, and profile metadata.',
      icon: PencilLine,
    },
    {
      href: '/dashboard/content',
      title: 'Create Content',
      description: 'Publish stories, polls, articles, sponsors, and hot takes.',
      icon: FileText,
    },
    {
      href: '/dashboard/highlights',
      title: 'Set Weekly Highlights',
      description: 'Feature a fan and sponsor endorsement for the week.',
      icon: Star,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 border-l-4 border-l-[#25B4B1] p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Admin Control Center
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right">
            <div className="rounded-xl border border-gray-200 text-center bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </p>
              <p className="mt-1 text-sm font-bold text-teal-700">
                {currentRaceStatus === 'live' ? 'Race Live' : 'Ready'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Race Weekend Widget */}
      {currentRace && (
        <RaceWeekendWidget
          initialRace={currentRace}
          initialRaceStatus={currentRaceStatus || 'upcoming'}
          initialMetrics={metrics}
        />
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Operations
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900">
              Priority Metrics
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className={`group rounded-2xl border border-gray-200 border-l-4 ${stat.accent} bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-xl p-2.5 ${stat.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-300 transition group-hover:text-[#25B4B1]" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                {stat.name}
              </p>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-mono text-4xl font-bold tabular-nums tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <div className={`rounded-full px-2.5 py-1 text-xs font-bold ${stat.badgeClassName}`}>
                  {stat.priority}
                </div>
              </div>
            </Link>
          )
        })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Command shortcuts
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group p-6 transition duration-300 hover:bg-gray-50"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-[#25B4B1]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{action.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#25B4B1]">
                    Open module
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Queue table
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">Review Load</h2>
          </div>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                    Queue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.slice(0, 3).map((stat) => (
                  <tr key={stat.name} className="transition hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{stat.name}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-bold tabular-nums text-gray-900">
                      {stat.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function getClosestUpcomingRace(
  tracks: Array<{ start_date: string | null } & Record<string, any>>
) {
  if (tracks.length === 0) return null

  const now = new Date()

  const upcoming = tracks.filter((track) => {
    if (!track.start_date) return false
    return new Date(track.start_date) >= now
  })

  if (upcoming.length > 0) {
    return upcoming.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return aTime - bTime
    })[0]
  }

  return tracks.sort((a, b) => {
    const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
    const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
    return bTime - aTime
  })[0]
}

