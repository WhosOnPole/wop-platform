import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { TrendingUp, Calendar, Star } from 'lucide-react'
import { FeedContent } from '@/components/feed/feed-content'
import { TrendingSection } from '@/components/feed/trending-section'
import { UpcomingRace } from '@/components/feed/upcoming-race'
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

interface TrackRace {
  id: string
  name: string
  start_date: string | null
  race_day_date: string | null
  location: string | null
  country: string | null
  image_url: string | null
  circuit_ref: string | null
  chat_enabled: boolean | null
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

function getClosestRaceFromTracks(params: { tracks: TrackRace[] }) {
  const { tracks } = params
  if (tracks.length === 0) return null

  const now = new Date()
  const graceMs = 24 * 60 * 60 * 1000

  // First, find live races (within race weekend window)
  const liveRaces = tracks.filter((track) => {
    if (!track.start_date || !track.race_day_date) return false
    if (track.chat_enabled === false) return false
    
    const start = new Date(track.start_date)
    const raceDay = new Date(track.race_day_date)
    const end = new Date(raceDay.getTime() + graceMs)
    
    return now >= start && now <= end
  })

  // If we have a live race, return it
  if (liveRaces.length > 0) {
    return liveRaces.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return bTime - aTime // Most recent first
    })[0]
  }

  // Otherwise, find the next upcoming race
  const upcomingRaces = tracks.filter((track) => {
    if (!track.start_date) return false
    return new Date(track.start_date) > now
  })

  if (upcomingRaces.length > 0) {
    return upcomingRaces.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
      return aTime - bTime // Earliest first
    })[0]
  }

  // Fallback: return the most recent past race
  return tracks.sort((a, b) => {
    const aTime = a.start_date ? new Date(a.start_date).getTime() : 0
    const bTime = b.start_date ? new Date(b.start_date).getTime() : 0
    return bTime - aTime
  })[0]
}

function isSpotlightGridType(value: unknown): value is SpotlightGridType {
  return value === 'driver' || value === 'team' || value === 'track'
}

function getSpotlightFeaturedGrid(params: { grid: unknown }) {
  const { grid } = params

  if (!grid) return null
  if (typeof grid !== 'object') return null

  const maybeGrid = grid as Record<string, unknown>
  const type = maybeGrid.type

  if (!isSpotlightGridType(type)) return null

  const user = maybeGrid.user as Record<string, unknown> | null | undefined

  return {
    id: String(maybeGrid.id),
    type,
    comment: typeof maybeGrid.blurb === 'string' ? maybeGrid.blurb : null,
    ranked_items: Array.isArray(maybeGrid.ranked_items) ? maybeGrid.ranked_items : [],
    user: user
      ? {
          id: String(user.id),
          username: String(user.username),
          profile_image_url: typeof user.profile_image_url === 'string' ? user.profile_image_url : null,
        }
      : null,
  }
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
    adminPolls,
    featuredNews,
    sponsors,
    weeklyHighlights,
    raceTracks,
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
    // Recent active polls (ends_at is null or in the future) - regular polls only
    supabase
      .from('polls')
      .select('*')
      .is('admin_id', null)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3),
    // Admin polls (ends_at is null or in the future)
    supabase
      .from('polls')
      .select('*')
      .not('admin_id', 'is', null)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false }),
    // Featured news
    supabase
      .from('news_stories')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(2),
    // All sponsors
    supabase
      .from('sponsors')
      .select('id, name, logo_url, website_url, description')
      .order('name'),
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
    // Upcoming race (based on tracks.start_date)
    supabase
      .from('tracks')
      .select('id, name, image_url, location, country, start_date, race_day_date, circuit_ref, chat_enabled')
      .not('start_date', 'is', null)
      .order('start_date', { ascending: true }),
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

  const upcomingRace = (() => {
    const race = getClosestRaceFromTracks({ tracks: (raceTracks.data || []) as TrackRace[] })
    if (!race) return null
    return {
      ...race,
      slug: slugify(race.name),
      chat_enabled: race.chat_enabled ?? undefined,
    }
  })()

  // Check if upcoming race is live (for carousel display)
  const isUpcomingRaceLive = (() => {
    if (!upcomingRace || !upcomingRace.start_date || !upcomingRace.race_day_date) return false
    if (upcomingRace.chat_enabled === false) return false
    
    const now = new Date()
    const start = new Date(upcomingRace.start_date)
    const raceDay = new Date(upcomingRace.race_day_date)
    const end = new Date(raceDay.getTime() + 24 * 60 * 60 * 1000) // +24 hours
    
    return now >= start && now <= end
  })()

  // Only show upcoming race in carousel when live
  const upcomingRaceForCarousel = isUpcomingRaceLive ? upcomingRace : null

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
    <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-white font-display mb-6">Post. React. <br/> Express Yourself.</h1>
      
      {/* Desktop: Grid layout with main feed on left and banner cards on right */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
        {/* Main Feed - Desktop (larger left column) */}
        <div className="lg:col-span-8 space-y-6">
          <FeedContent
            posts={followingPosts.data || []}
            grids={followingGrids.data || []}
            featuredNews={[]}
          />
        </div>

        {/* Right Column - Banner Cards and Trending */}
        <div className="lg:col-span-4 space-y-4">
          {/* Banner Cards Sidebar - Desktop */}
          <SpotlightCarousel
            spotlight={{
              hot_take: activeHotTake.data || null,
              featured_grid: getSpotlightFeaturedGrid({ grid: weeklyHighlights.data?.highlighted_fan_grid }),
            }}
            polls={adminPolls.data || []}
            discussionPosts={hotTakePosts}
            upcomingRace={upcomingRaceForCarousel}
            sponsors={(sponsors.data || []) as Array<{ id: string; name: string; logo_url: string | null; website_url: string | null; description: string | null }>}
            featuredNews={(featuredNews.data || []) as Array<{ id: string; title: string; image_url: string | null; content: string; created_at: string }>}
          />

          {/* Trending */}
          {trendingWithLinks.length > 0 && (
            <TrendingSection posts={trendingWithLinks} />
          )}
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="lg:hidden">
        {/* Spotlight Carousel: hot take, featured grid, polls, upcoming race, sponsors, news */}
        <div className="mb-8">
          <SpotlightCarousel
            spotlight={{
              hot_take: activeHotTake.data || null,
              featured_grid: getSpotlightFeaturedGrid({ grid: weeklyHighlights.data?.highlighted_fan_grid }),
            }}
            polls={adminPolls.data || []}
            discussionPosts={hotTakePosts}
            upcomingRace={upcomingRaceForCarousel}
            sponsors={(sponsors.data || []) as Array<{ id: string; name: string; logo_url: string | null; website_url: string | null; description: string | null }>}
            featuredNews={(featuredNews.data || []) as Array<{ id: string; title: string; image_url: string | null; content: string; created_at: string }>}
          />
        </div>

        {/* Main Feed */}
        <div className="space-y-6">
          <FeedContent
            posts={followingPosts.data || []}
            grids={followingGrids.data || []}
            featuredNews={[]}
          />
        </div>

        {/* Sidebar */}
        <div className="mt-6 space-y-6">
          {/* Trending */}
          {trendingWithLinks.length > 0 && (
            <TrendingSection posts={trendingWithLinks} />
          )}
        </div>
      </div>
    </div>
  )
}

type SpotlightGridType = 'driver' | 'team' | 'track'
