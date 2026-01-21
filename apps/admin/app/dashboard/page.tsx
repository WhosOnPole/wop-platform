import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, Flag, MessageSquare, FileText } from 'lucide-react'
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

  // Get current/upcoming race weekend
  const now = new Date().toISOString()
  const { data: currentRace } = await supabase
    .from('tracks')
    .select('id, name, location, start_date, race_day_date, chat_enabled')
    .not('start_date', 'is', null)
    .not('race_day_date', 'is', null)
    .or(`start_date.lte.${now},and(start_date.gte.${now},race_day_date.gte.${now})`)
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

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
  const [pendingReports, pendingTips, recentNews, recentArticles] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('track_tips')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
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
      color: 'bg-red-500',
    },
    {
      name: 'Pending Track Tips',
      value: pendingTips.count || 0,
      icon: MessageSquare,
      href: '/dashboard/track-tips',
      color: 'bg-yellow-500',
    },
    {
      name: 'News Stories',
      value: recentNews.count || 0,
      icon: FileText,
      href: '/dashboard/content',
      color: 'bg-blue-500',
    },
    {
      name: 'Published Articles',
      value: recentArticles.count || 0,
      icon: FileText,
      href: '/dashboard/content',
      color: 'bg-green-500',
    },
  ]

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Race Weekend Widget */}
      {currentRace && (
        <RaceWeekendWidget
          initialRace={currentRace}
          initialMetrics={metrics}
        />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="group relative overflow-hidden rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-full ${stat.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/data-enrichment"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Enrich Driver/Team/Track Data</h3>
            <p className="mt-2 text-sm text-gray-600">
              Add images, bios, and other enriched content
            </p>
          </Link>
          <Link
            href="/dashboard/content"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Create Content</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create news stories, polls, articles, and more
            </p>
          </Link>
          <Link
            href="/dashboard/highlights"
            className="rounded-lg border border-gray-200 bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Set Weekly Highlights</h3>
            <p className="mt-2 text-sm text-gray-600">
              Highlight a fan and sponsor for the week
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}

