import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parseDateOnly } from '@/utils/date-utils'
import { FeedContent, type Post, type Grid } from '@/components/feed/feed-content'
import { SpotlightCarousel } from '@/components/feed/spotlight-carousel'
import { FeedHighlightedSidebar } from '@/components/feed/feed-highlighted-sidebar'
import { SponsorCard } from '@/components/feed/sponsor-card'
import { FeaturedNewsCard } from '@/components/feed/featured-news-card'
import { BannerPollCard } from '@/components/feed/banner-poll-card'
import { BannerFeaturedGridCard } from '@/components/feed/banner-featured-grid-card'
import { BannerHighlightedFanCard } from '@/components/feed/banner-highlighted-fan-card'

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
  end_date: string | null
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
    if (!track.start_date || !track.end_date) return false
    if (track.chat_enabled === false) return false

    const start = new Date(track.start_date)
    const endDay =
      track.end_date.length <= 10 ? parseDateOnly(track.end_date) : new Date(track.end_date)
    if (!endDay) return false
    const end = new Date(endDay.getTime() + graceMs)

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
    adminPollsForBanner,
    featuredNews,
    sponsors,
    weeklyHighlights,
    raceTracks,
    activeHotTake,
  ] = await Promise.all([
    // Posts from current user + users you follow
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
      .then(async (result) => {
        const followingIds = result.data?.map((f) => f.following_id) || []
        const userIds = [session.user.id, ...followingIds]
        const { data: posts } = await supabase
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
          .in('user_id', userIds)
          .order('created_at', { ascending: false })
          .limit(20)
        return { data: posts || [] }
      }),
    // Grids from current user + users they follow (ordered by updated_at so updates appear chronologically)
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', session.user.id)
      .then(async (result) => {
        const followingIds = result.data?.map((f) => f.following_id) || []
        const userIds = [session.user.id, ...followingIds]
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
          .in('user_id', userIds)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(20)
        return { data: grids || [] }
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
    // Admin polls for banner: only active (not expired) so featured poll hides when expired
    supabase
      .from('polls')
      .select('*')
      .not('admin_id', 'is', null)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
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
      .select('id, name, image_url, location, country, start_date, end_date, circuit_ref, chat_enabled')
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
    if (!upcomingRace || !upcomingRace.start_date || !upcomingRace.end_date) return false
    if (upcomingRace.chat_enabled === false) return false

    const now = new Date()
    const start = new Date(upcomingRace.start_date)
    const endDay =
      upcomingRace.end_date.length <= 10
        ? parseDateOnly(upcomingRace.end_date)
        : new Date(upcomingRace.end_date)
    if (!endDay) return false
    const end = new Date(endDay.getTime() + 24 * 60 * 60 * 1000) // +24 hours

    return now >= start && now <= end
  })()

  // Only show upcoming race in carousel when live; fetch distinct users in chat (last 10 min) once per page load
  let upcomingRaceForCarousel: (typeof upcomingRace & { liveChatUserCount?: number }) | null =
    isUpcomingRaceLive ? upcomingRace : null
  if (upcomingRaceForCarousel?.id) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: recentMessages } = await supabase
      .from('live_chat_messages')
      .select('user_id')
      .eq('track_id', upcomingRaceForCarousel.id)
      .gte('created_at', tenMinutesAgo)
    const liveChatUserCount = recentMessages
      ? new Set(recentMessages.map((r: { user_id: string }) => r.user_id)).size
      : 0
    upcomingRaceForCarousel = { ...upcomingRaceForCarousel, liveChatUserCount }
  }

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

  // Current user's like state for feed posts (for LikeButton initialIsLiked)
  const followingPostsList = followingPosts.data || []
  const feedPostIds = followingPostsList.map((p: { id: string }) => p.id)
  let userLikedPostIds = new Set<string>()
  if (feedPostIds.length > 0) {
    const { data: postLikes } = await supabase
      .from('votes')
      .select('target_id')
      .eq('user_id', session.user.id)
      .eq('target_type', 'post')
      .in('target_id', feedPostIds)
    postLikes?.forEach((row: { target_id: string }) => userLikedPostIds.add(row.target_id))
  }
  // Comment counts per post (for Comment button label)
  let commentCountByPostId: Record<string, number> = {}
  if (feedPostIds.length > 0) {
    const { data: commentRows } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', feedPostIds)
    commentRows?.forEach((row: { post_id: string }) => {
      commentCountByPostId[row.post_id] = (commentCountByPostId[row.post_id] ?? 0) + 1
    })
  }

  const enrichedFeedPosts = followingPostsList.map((p: Record<string, unknown> & { id: string; like_count?: number | null }) => ({
    ...p,
    like_count: p.like_count ?? 0,
    is_liked: userLikedPostIds.has(p.id),
    comment_count: commentCountByPostId[p.id] ?? 0,
  })) as Post[]

  // Repost poll IDs: posts with parent_page_type='poll' for embedded poll cards
  const repostPollIds = [
    ...new Set(
      followingPostsList
        .filter(
          (p: Record<string, unknown>) =>
            p.parent_page_type === 'poll' && p.parent_page_id && typeof p.parent_page_id === 'string'
        )
        .map((p: Record<string, unknown>) => p.parent_page_id as string)
    ),
  ]
  type EmbeddedPollData = {
    poll: { id: string; question: string; options?: unknown[]; is_featured_podium?: boolean; created_at: string }
    userResponse: string | undefined
    voteCounts: Record<string, number>
  }
  let embeddedPollsByPollId: Record<string, EmbeddedPollData> = {}
  if (repostPollIds.length > 0) {
    const { data: repostPolls } = await supabase
      .from('polls')
      .select('id, question, options, is_featured_podium, created_at, ends_at')
      .in('id', repostPollIds)
    const pollsMap = new Map((repostPolls || []).map((p) => [p.id, p]))
    let repostUserResponses: Record<string, string> = {}
    let repostVoteCounts: Record<string, Record<string, number>> = {}
    if (session) {
      const { data: resp } = await supabase
        .from('poll_responses')
        .select('poll_id, selected_option_id')
        .eq('user_id', session.user.id)
        .in('poll_id', repostPollIds)
      if (resp) {
        repostUserResponses = resp.reduce((acc, r) => {
          acc[r.poll_id] = r.selected_option_id
          return acc
        }, {} as Record<string, string>)
      }
    }
    const { data: allResp } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .in('poll_id', repostPollIds)
    if (allResp) {
      repostVoteCounts = allResp.reduce(
        (acc, r) => {
          if (!acc[r.poll_id]) acc[r.poll_id] = {}
          acc[r.poll_id][r.selected_option_id] = (acc[r.poll_id][r.selected_option_id] || 0) + 1
          return acc
        },
        {} as Record<string, Record<string, number>>
      )
    }
    repostPollIds.forEach((pollId) => {
      const poll = pollsMap.get(pollId)
      if (poll) {
        embeddedPollsByPollId[pollId] = {
          poll: {
            id: poll.id,
            question: poll.question,
            options: poll.options,
            is_featured_podium: poll.is_featured_podium ?? false,
            created_at: poll.created_at,
          },
          userResponse: repostUserResponses[pollId],
          voteCounts: repostVoteCounts[pollId] ?? {},
        }
      }
    })
  }

  // Enrich feed grids: ranked_items with images/location, like/comment counts
  const feedGridsRaw = followingGrids.data || []
  const enrichedFeedGrids = await Promise.all(
    feedGridsRaw.map(async (grid: Record<string, unknown> & { id: string; type: string; ranked_items: any[]; user_id: string }) => {
      const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
      const enrichedItems = await Promise.all(
        rankedItems.map(async (item: { id: string; name: string }) => {
          if (grid.type === 'driver') {
            const { data: driver } = await supabase
              .from('drivers')
              .select('id, name, headshot_url, image_url')
              .eq('id', item.id)
              .maybeSingle()
            return {
              ...item,
              headshot_url: driver?.headshot_url || null,
              image_url: driver?.headshot_url || driver?.image_url || null,
            }
          }
          if (grid.type === 'track') {
            const { data: track } = await supabase
              .from('tracks')
              .select('id, name, image_url, location, country, circuit_ref')
              .eq('id', item.id)
              .maybeSingle()
            return {
              ...item,
              image_url: track?.image_url || null,
              location: track?.location || null,
              country: track?.country || null,
              circuit_ref: track?.circuit_ref || null,
            }
          }
          return item
        })
      )
      const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
        supabase.from('grid_likes').select('*', { count: 'exact', head: true }).eq('grid_id', grid.id),
        supabase.from('grid_slot_comments').select('*', { count: 'exact', head: true }).eq('grid_id', grid.id),
      ])
      const { data: userLike } = await supabase
        .from('grid_likes')
        .select('id')
        .eq('grid_id', grid.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
      const user = grid.user as Record<string, unknown> | null
      return {
        ...grid,
        ranked_items: enrichedItems,
        blurb: grid.blurb ?? null,
        like_count: likeCount ?? 0,
        comment_count: commentCount ?? 0,
        is_liked: !!userLike,
        created_at: grid.updated_at || grid.created_at,
        user: user
          ? {
              id: user.id,
              username: user.username,
              profile_image_url: user.profile_image_url ?? null,
            }
          : null,
      }
    })
  )

  const sponsorsList = (sponsors.data || []) as Array<{
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
    description: string | null
  }>
  const featuredNewsList = (featuredNews.data || []) as Array<{
    id: string
    title: string
    image_url: string | null
    content: string
    created_at: string
  }>

  const adminPollsList = (adminPolls.data || []) as Array<{
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
  }>
  const adminPollsForBannerList = (adminPollsForBanner.data || []) as Array<{
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
  }>
  const communityPollsList = (polls.data || []) as Array<{
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
  }>
  const allActivePolls = [...adminPollsList, ...communityPollsList]
  // Banner uses active admin polls only (expired hidden), featured first
  const featuredAdminPoll =
    adminPollsForBannerList.find((p) => p.is_featured_podium) ??
    adminPollsForBannerList[0] ??
    null

  const allFeedPollIds = [
    ...new Set([
      ...adminPollsList.map((p) => p.id),
      ...communityPollsList.map((p) => p.id),
    ]),
  ]
  let feedPollUserResponses: Record<string, string> = {}
  let feedPollVoteCounts: Record<string, Record<string, number>> = {}
  if (allFeedPollIds.length > 0) {
    if (session) {
      const { data: responses } = await supabase
        .from('poll_responses')
        .select('poll_id, selected_option_id')
        .eq('user_id', session.user.id)
        .in('poll_id', allFeedPollIds)
      if (responses) {
        feedPollUserResponses = responses.reduce(
          (acc, r) => {
            acc[r.poll_id] = r.selected_option_id
            return acc
          },
          {} as Record<string, string>
        )
      }
    }
    const { data: allResponses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .in('poll_id', allFeedPollIds)
    if (allResponses) {
      feedPollVoteCounts = allResponses.reduce(
        (acc, r) => {
          if (!acc[r.poll_id]) acc[r.poll_id] = {}
          acc[r.poll_id][r.selected_option_id] =
            (acc[r.poll_id][r.selected_option_id] || 0) + 1
          return acc
        },
        {} as Record<string, Record<string, number>>
      )
    }
  }

  const bannerPollUserResponse = featuredAdminPoll?.id
    ? feedPollUserResponses[featuredAdminPoll.id]
    : undefined

  const featuredStory = featuredNewsList[0] ?? null
  const featuredGrid = getSpotlightFeaturedGrid({
    grid: weeklyHighlights.data?.highlighted_fan_grid,
  })
  const highlightedFanRaw = weeklyHighlights.data?.highlighted_fan
  const highlightedFanProfile = Array.isArray(highlightedFanRaw)
    ? highlightedFanRaw[0]
    : highlightedFanRaw
  const highlightedFan = highlightedFanProfile
    ? {
        id: String(highlightedFanProfile.id),
        username: String(highlightedFanProfile.username),
        profile_image_url:
          typeof highlightedFanProfile.profile_image_url === 'string'
            ? highlightedFanProfile.profile_image_url
            : null,
      }
    : null

  type BannerItem =
    | { type: 'sponsor'; data: (typeof sponsorsList)[number] }
    | { type: 'featured_poll'; data: NonNullable<typeof featuredAdminPoll> }
    | { type: 'featured_story'; data: NonNullable<typeof featuredStory> }
    | { type: 'featured_grid'; data: NonNullable<typeof featuredGrid> }
    | { type: 'featured_user'; data: NonNullable<typeof highlightedFan> }
  const bannerItems: BannerItem[] = []
  sponsorsList.forEach((sponsor) => bannerItems.push({ type: 'sponsor', data: sponsor }))
  if (featuredAdminPoll) bannerItems.push({ type: 'featured_poll', data: featuredAdminPoll })
  if (featuredStory) bannerItems.push({ type: 'featured_story', data: featuredStory })
  if (featuredGrid) bannerItems.push({ type: 'featured_grid', data: featuredGrid })
  if (highlightedFan) bannerItems.push({ type: 'featured_user', data: highlightedFan })

  // Desktop banner: sponsors + featured grid + highlighted fan only (no news, no featured poll — those live in the left sidebar)
  const desktopBannerItems = bannerItems.filter(
    (item) => item.type !== 'featured_story' && item.type !== 'featured_poll'
  )

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-white font-display">Feed</h1>
        <h3 className="text-sm text-white/80 font-sans mb-4">Post. React. Express Yourself.</h3>
      </div>

      {desktopBannerItems.length > 0 && (
        <div className="relative z-10 hidden w-full border-y border-white/10 bg-black/20 px-4 py-6 sm:px-6 lg:block lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-nowrap items-stretch gap-6 overflow-x-auto lg:gap-8">
            {desktopBannerItems.map((item) => (
              <div
                key={
                  item.type === 'sponsor'
                    ? `sponsor-${item.data.id}`
                    : item.type === 'featured_grid'
                      ? `grid-${item.data.id}`
                      : `fan-${item.data.id}`
                }
                className="min-h-[140px] min-w-[200px] max-w-[240px] flex-shrink-0"
              >
                {item.type === 'sponsor' && (
                  <SponsorCard sponsor={item.data} variant="banner" />
                )}
                {item.type === 'featured_grid' && (
                  <BannerFeaturedGridCard grid={item.data} />
                )}
                {item.type === 'featured_user' && (
                  <BannerHighlightedFanCard fan={item.data} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pt-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:pt-6 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-4 lg:space-y-4">
          <FeedHighlightedSidebar
            spotlight={{ hot_take: activeHotTake.data || null }}
            highlightedFan={(() => {
              const fan = weeklyHighlights.data?.highlighted_fan
              const profile = Array.isArray(fan) ? fan[0] : fan
              if (!profile) return null
              return {
                id: String(profile.id),
                username: String(profile.username),
                profile_image_url:
                  typeof profile.profile_image_url === 'string' ? profile.profile_image_url : null,
              }
            })()}
            featuredGrid={getSpotlightFeaturedGrid({
              grid: weeklyHighlights.data?.highlighted_fan_grid,
            })}
            polls={adminPolls.data || []}
            userResponses={feedPollUserResponses}
            voteCounts={feedPollVoteCounts}
            featuredNews={featuredNewsList}
            discussionPosts={hotTakePosts}
          />
        </aside>
        <div className="lg:col-span-8 space-y-6 md:space-y-0">
          <div className="relative z-10 lg:hidden mb-0">
            <SpotlightCarousel
              spotlight={{
                hot_take: activeHotTake.data || null,
                featured_grid: getSpotlightFeaturedGrid({ grid: weeklyHighlights.data?.highlighted_fan_grid }),
              }}
              polls={adminPolls.data || []}
              userResponses={feedPollUserResponses}
              voteCounts={feedPollVoteCounts}
              discussionPosts={hotTakePosts}
              upcomingRace={upcomingRaceForCarousel}
              sponsors={sponsorsList}
              featuredNews={featuredNewsList}
            />
          </div>
          <FeedContent
            posts={enrichedFeedPosts}
            grids={enrichedFeedGrids as Grid[]}
            embeddedPollsByPollId={embeddedPollsByPollId}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
            currentUserId={session.user.id}
            featuredNews={[]}
          />
        </div>
        </div>
      </div>
    </div>
  )
}

type SpotlightGridType = 'driver' | 'team' | 'track'
