import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TrendingUp, Calendar, Star } from 'lucide-react'
import { FeedContent } from '@/components/feed/feed-content'
import { TrendingSection } from '@/components/feed/trending-section'
import { UpcomingRace } from '@/components/feed/upcoming-race'
import { HighlightsSection } from '@/components/feed/highlights-section'
import { SpotlightCarousel } from '@/components/feed/spotlight-carousel'

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
    activeHotTake,
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
    // Recent active polls (ends_at is null or in the future)
    supabase
      .from('polls')
      .select('*')
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3),
    // Featured news
    supabase
      .from('news_stories')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(2),
    // Weekly highlights (with featured fan + grid if set)
    (async () => {
      const { data: highlights } = await supabase
        .from('weekly_highlights')
        .select(
          `
          highlighted_fan_id,
          highlighted_sponsor_id,
          highlighted_fan_grid_id,
          highlighted_fan:profiles!highlighted_fan_id (
            id,
            username,
            profile_image_url
          ),
          highlighted_sponsor:sponsors!highlighted_sponsor_id (
            id,
            name,
            logo_url
          ),
          highlighted_fan_grid:grids!highlighted_fan_grid_id (
            *,
            user:profiles!user_id (
              id,
              username,
              profile_image_url
            )
          )
        `
        )
        .eq('week_start_date', weekStart)
        .single()

      return { data: highlights || null }
    })(),
    // Upcoming race
    supabase
      .from('race_schedule')
      .select('*')
      .gte('race_time', new Date().toISOString())
      .order('race_time', { ascending: true })
      .limit(1)
      .single(),
    // Active hot take (single) by date range
    (async () => {
      const nowIso = new Date().toISOString()
      const { data } = await supabase
        .from('hot_takes')
        .select(
          `
          id,
          content_text,
          starts_at,
          ends_at,
          featured_grid_id,
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
        .lte('starts_at', nowIso)
        .gt('ends_at', nowIso)
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      return { data }
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

  // Fetch hot take discussion posts if active hot take exists
  let hotTakePosts: any[] = []
  if (activeHotTake.data?.id) {
    const { data: htPosts } = await supabase
      .from('posts')
      .select(
        `
        *,
        like_count,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('parent_page_type', 'hot_take')
      .eq('parent_page_id', activeHotTake.data.id)
      .order('created_at', { ascending: false })
      .limit(20)

    hotTakePosts = htPosts || []
  }

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

      {/* Spotlight Carousel: hot take, featured grid, polls */}
      <div className="mb-6">
        <SpotlightCarousel
          spotlight={{
            hot_take: activeHotTake.data || null,
            featured_grid: weeklyHighlights.data?.highlighted_fan_grid || null,
          }}
          polls={polls.data || []}
          discussionPosts={hotTakePosts}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <FeedContent
            posts={followingPosts.data || []}
            grids={followingGrids.data || []}
            featuredNews={featuredNews.data || []}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
