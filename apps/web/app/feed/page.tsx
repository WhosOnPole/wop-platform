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

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export default async function FeedPage() {
  const supabase = createServerComponentClient({ cookies })
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
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hot Take Tuesday */}
          {hotTake.data && <HotTakeTuesday hotTake={hotTake.data} />}

          {/* Trending */}
          {trendingPosts.data && trendingPosts.data.length > 0 && (
            <TrendingSection posts={trendingPosts.data} />
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
