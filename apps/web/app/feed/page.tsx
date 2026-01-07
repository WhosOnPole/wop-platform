import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TrendingUp, Calendar, Star, Radio } from 'lucide-react'
import { FeedContent } from '@/components/feed/feed-content'
import { TrendingSection } from '@/components/feed/trending-section'
import { UpcomingRace } from '@/components/feed/upcoming-race'
import { HighlightsSection } from '@/components/feed/highlights-section'
import { HotTakeTuesday } from '@/components/feed/hot-take-tuesday'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

export default async function FeedPage() {
  const supabase = createServerComponentClient(
    { cookies: () => cookies() },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  const weekStart = await getCurrentWeekStart()

  // Fetch personalized feed content
  const [
    followingPosts,
    followingGrids,
    polls,
    featuredNews,
    weeklyHighlights,
    upcomingRace,
    hotTake,
    trendingPosts,
  ] = await Promise.all([
    // Posts from users you follow
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
      .then(async (result) => {
        if (result.data && result.data.length > 0) {
          const followingIds = result.data.map((f) => f.following_id)
          const { data: posts } = await supabase
            .from('posts')
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
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(10)
          return { data: posts }
        }
        return { data: [] }
      }),
    // Grids from users you follow
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
      .then(async (result) => {
        if (result.data && result.data.length > 0) {
          const followingIds = result.data.map((f) => f.following_id)
          const { data: grids } = await supabase
            .from('grids')
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
            .in('user_id', followingIds)
            .order('created_at', { ascending: false })
            .limit(5)
          return { data: grids }
        }
        return { data: [] }
      }),
    // Recent polls
    supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3),
    // Featured news
    supabase
      .from('news_stories')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(2),
    // Weekly highlights
    (async () => {
      const { data: highlights } = await supabase
        .from('weekly_highlights')
        .select('highlighted_fan_id, highlighted_sponsor_id')
        .eq('week_start_date', weekStart)
        .single()

      if (highlights) {
        const [fan, sponsor] = await Promise.all([
          highlights.highlighted_fan_id
            ? supabase
                .from('profiles')
                .select('id, username, profile_image_url')
                .eq('id', highlights.highlighted_fan_id)
                .single()
            : Promise.resolve({ data: null }),
          highlights.highlighted_sponsor_id
            ? supabase
                .from('sponsors')
                .select('*')
                .eq('id', highlights.highlighted_sponsor_id)
                .single()
            : Promise.resolve({ data: null }),
        ])
        return {
          data: {
            highlighted_fan: fan.data,
            highlighted_sponsor: sponsor.data,
          },
        }
      }
      return { data: null }
    })(),
    // Upcoming race
    supabase
      .from('race_schedule')
      .select('*')
      .gte('race_time', new Date().toISOString())
      .order('race_time', { ascending: true })
      .limit(1)
      .single(),
    // Hot Take Tuesday
    (async () => {
      const today = new Date()
      if (today.getDay() === 2) {
        // Tuesday
        const todayStr = today.toISOString().split('T')[0]
        const { data } = await supabase
          .from('hot_takes')
          .select(
            `
            *,
            featured_grid:grids!featured_grid_id (
              *,
              user:profiles!user_id (
                id,
                username,
                profile_image_url
              )
            )
          `
          )
          .eq('active_date', todayStr)
          .single()
        return { data }
      }
      return { data: null }
    })(),
    // Trending posts (most active in last 24 hours)
    supabase
      .from('posts')
      .select(
        `
        *,
        parent_page_type,
        parent_page_id,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Build parent lookups for trending posts to avoid 404s
  const trending = trendingPosts.data || []
  const driverIds = trending
    .filter((p) => p.parent_page_type === 'driver' && p.parent_page_id)
    .map((p) => p.parent_page_id as string)
  const teamIds = trending
    .filter((p) => p.parent_page_type === 'team' && p.parent_page_id)
    .map((p) => p.parent_page_id as string)
  const trackIds = trending
    .filter((p) => p.parent_page_type === 'track' && p.parent_page_id)
    .map((p) => p.parent_page_id as string)

  const [driverLookup, teamLookup, trackLookup] = await Promise.all([
    driverIds.length
      ? supabase
          .from('drivers')
          .select('id, name')
          .in('id', driverIds)
          .then((res) => Object.fromEntries((res.data || []).map((d) => [d.id, slugify(d.name)])))
      : {},
    teamIds.length
      ? supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds)
          .then((res) => Object.fromEntries((res.data || []).map((t) => [t.id, slugify(t.name)])))
      : {},
    trackIds.length
      ? supabase
          .from('tracks')
          .select('id, name')
          .in('id', trackIds)
          .then((res) => Object.fromEntries((res.data || []).map((t) => [t.id, slugify(t.name)])))
      : {},
  ])

  const trendingWithLinks = trending.map((post) => {
    const type = post.parent_page_type as string | null
    const parentId = post.parent_page_id as string | null
    let href = '/feed'

    if (type && parentId) {
      const slug =
        type === 'driver'
          ? (driverLookup as Record<string, string>)[parentId]
          : type === 'team'
          ? (teamLookup as Record<string, string>)[parentId]
          : type === 'track'
          ? (trackLookup as Record<string, string>)[parentId]
          : null

      if (slug) {
        const pathType = type === 'track' ? 'tracks' : `${type}s`
        href = `/${pathType}/${slug}`
      }
    }

    return { ...post, href }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Feed</h1>
        <p className="mt-2 text-gray-600">Stay up to date with the F1 community</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <FeedContent
            posts={followingPosts.data || []}
            grids={followingGrids.data || []}
            polls={polls.data || []}
            featuredNews={featuredNews.data || []}
            weeklyHighlights={weeklyHighlights.data || null}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hot Take Tuesday */}
          {hotTake.data && <HotTakeTuesday hotTake={hotTake.data} />}

          {/* Trending */}
          {trendingWithLinks.length > 0 && (
            <TrendingSection posts={trendingWithLinks} />
          )}

          {/* Upcoming Race */}
          {upcomingRace.data && <UpcomingRace race={upcomingRace.data} />}

          {/* Highlights */}
          {weeklyHighlights.data && (
            <HighlightsSection highlights={weeklyHighlights.data} />
          )}
        </div>
      </div>
    </div>
  )
}
