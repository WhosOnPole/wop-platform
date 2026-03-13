import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parseDateOnly } from '@/utils/date-utils'
import { FeedContent, type Post, type Grid, type GridCommentItem } from '@/components/feed/feed-content'
import { SpotlightCarousel } from '@/components/feed/spotlight-carousel'
import { FeedHighlightedSidebar } from '@/components/feed/feed-highlighted-sidebar'
import { SponsorCard } from '@/components/feed/sponsor-card'
import { FeaturedNewsCard } from '@/components/feed/featured-news-card'
import { BannerPollCard } from '@/components/feed/banner-poll-card'
import { FeaturedGridPostBlock } from '@/components/feed/featured-grid-post-block'
import { toEntitySlug } from '@/utils/url-slug'
import { getTrackSlug } from '@/utils/storage-urls'

/** Supabase can return joined relations as arrays; normalize to single object for GridCommentItem */
function normalizeGridComments(
  rows: Array<{
    id: string
    grid_id: string
    rank_index: number
    content: string
    created_at: string
    user?: unknown
    grid?: unknown
  }>
): GridCommentItem[] {
  return rows.map((row) => ({
    id: row.id,
    grid_id: row.grid_id,
    rank_index: row.rank_index,
    content: row.content,
    created_at: row.created_at,
    user: Array.isArray(row.user) ? (row.user[0] as GridCommentItem['user']) ?? null : (row.user as GridCommentItem['user']) ?? null,
    grid: Array.isArray(row.grid) ? (row.grid[0] as GridCommentItem['grid']) ?? null : (row.grid as GridCommentItem['grid']) ?? null,
  }))
}

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

  // Find the next upcoming race (by start_date)
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
    updated_at: maybeGrid.updated_at != null ? String(maybeGrid.updated_at) : null,
    created_at: maybeGrid.created_at != null ? String(maybeGrid.created_at) : null,
    user: user
      ? {
          id: String(user.id),
          username: String(user.username),
          profile_image_url: typeof user.profile_image_url === 'string' ? user.profile_image_url : null,
        }
      : null,
  }
}

const INITIAL_POSTS_LIMIT = 8
const INITIAL_GRIDS_LIMIT = 8
const LOAD_MORE_INCREMENT = 8

export async function FeedPageContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedParams = await searchParams
  const page = Math.max(1, parseInt(resolvedParams?.page ?? '1', 10) || 1)
  const postsLimit = INITIAL_POSTS_LIMIT + (page - 1) * LOAD_MORE_INCREMENT
  const gridsLimit = INITIAL_GRIDS_LIMIT + (page - 1) * LOAD_MORE_INCREMENT

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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch follows once and reuse for posts + grids (removes duplicate round-trip)
  const { data: followsData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)
  const followingIds = followsData?.map((f: { following_id: string }) => f.following_id) || []
  const userIds = [session.user.id, ...followingIds]

  // Fetch personalized feed content (parallel, no cascading follows)
  const [
    followingPosts,
    followingGrids,
    gridCommentsOnMyGrids,
    polls,
    adminPolls,
    adminPollsForBanner,
    featuredNews,
    sponsors,
    weeklyHighlights,
    activeHotTake,
    currentUserProfileResult,
  ] = await Promise.all([
    // Posts from current user + users you follow
    supabase
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
      .limit(postsLimit)
      .then((r) => ({ data: r.data || [] })),
    // Grids from current user + users they follow (ordered by updated_at so updates appear chronologically)
    supabase
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
      .limit(gridsLimit)
      .then((r) => ({ data: r.data || [] })),
    // Grid slot comments on current user's grids (owner sees these in feed)
    supabase
      .from('grids')
      .select('id')
      .eq('user_id', session.user.id)
      .then(async (result) => {
        const myGridIds = (result.data || []).map((g: { id: string }) => g.id)
        if (myGridIds.length === 0) return { data: [] }
        const { data: comments } = await supabase
          .from('grid_slot_comments')
          .select(
            `
            id,
            grid_id,
            rank_index,
            content,
            created_at,
            user:profiles!user_id (
              id,
              username,
              profile_image_url
            ),
            grid:grids!grid_id (
              id,
              type
            )
          `
          )
          .in('grid_id', myGridIds)
          .is('parent_comment_id', null)
          .order('created_at', { ascending: false })
          .limit(20)
        return { data: comments || [] }
      }),
    // Community polls from last 30 days
    supabase
      .from('polls')
      .select('*')
      .is('admin_id', null)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(3),
    // Admin polls from last 30 days
    supabase
      .from('polls')
      .select('*')
      .not('admin_id', 'is', null)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20),
    // Admin polls for banner: only active (not expired) so featured poll hides when expired
    supabase
      .from('polls')
      .select('*')
      .not('admin_id', 'is', null)
      .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20),
    // Featured news (with author for spotlight story card)
    supabase
      .from('news_stories')
      .select(
        `
        *,
        author:profiles!admin_id (id, username, profile_image_url)
      `
      )
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(2),
    // All sponsors
    supabase
      .from('sponsors')
      .select('id, name, logo_url, website_url, description')
      .order('name')
      .limit(50),
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
    // Current user profile (for nav glow) - parallel with main batch
    supabase
      .from('profiles')
      .select('nav_glow_dismissed_at')
      .eq('id', session.user.id)
      .single(),
  ])

  const currentUserProfile = currentUserProfileResult.data
  const isNewUser = !currentUserProfile?.nav_glow_dismissed_at

  // Filter posts: only hot_take, poll, profile, driver, team (exclude track entity comments)
  const allowedPostParentTypes = ['hot_take', 'poll', 'profile', 'driver', 'team'] as const
  const followingPostsListRaw = followingPosts.data || []
  const followingPostsList = followingPostsListRaw.filter(
    (p: Record<string, unknown>) =>
      p.parent_page_type == null || allowedPostParentTypes.includes(p.parent_page_type as (typeof allowedPostParentTypes)[number])
  )
  const feedPostIds = followingPostsList.map((p: { id: string }) => p.id)

  // Entity refs and hot take IDs for second batch
  const entityTypes = ['driver', 'team', 'track'] as const
  const entityRefs = followingPostsList
    .filter(
      (p: Record<string, unknown>) =>
        entityTypes.includes(p.parent_page_type as (typeof entityTypes)[number]) &&
        typeof p.parent_page_id === 'string'
    )
    .map((p: Record<string, unknown>) => ({
      type: p.parent_page_type as (typeof entityTypes)[number],
      id: p.parent_page_id as string,
    }))
  const driverEntityIds = entityRefs.filter((r) => r.type === 'driver').map((r) => r.id)
  const teamEntityIds = entityRefs.filter((r) => r.type === 'team').map((r) => r.id)
  const trackEntityIds = entityRefs.filter((r) => r.type === 'track').map((r) => r.id)
  const hotTakePostIds = [
    ...new Set(
      followingPostsList
        .filter(
          (p: Record<string, unknown>) =>
            p.parent_page_type === 'hot_take' && p.parent_page_id && typeof p.parent_page_id === 'string'
        )
        .map((p: Record<string, unknown>) => p.parent_page_id as string)
    ),
  ]

  // Second batch: parallel fetches that depend on followingPostsList
  const [
    postLikesResult,
    commentRowsResult,
    driverEntities,
    teamEntities,
    trackEntities,
    hotTakesResult,
    hotTakePostsResult,
  ] = await Promise.all([
    feedPostIds.length > 0
      ? supabase
          .from('votes')
          .select('target_id')
          .eq('user_id', session.user.id)
          .eq('target_type', 'post')
          .in('target_id', feedPostIds)
      : Promise.resolve({ data: [] }),
    feedPostIds.length > 0
      ? supabase.from('comments').select('post_id').in('post_id', feedPostIds)
      : Promise.resolve({ data: [] }),
    driverEntityIds.length > 0
      ? supabase.from('drivers').select('id, name').in('id', driverEntityIds)
      : Promise.resolve({ data: [] }),
    teamEntityIds.length > 0
      ? supabase.from('teams').select('id, name').in('id', teamEntityIds)
      : Promise.resolve({ data: [] }),
    trackEntityIds.length > 0
      ? supabase.from('tracks').select('id, name').in('id', trackEntityIds)
      : Promise.resolve({ data: [] }),
    hotTakePostIds.length > 0
      ? supabase.from('hot_takes').select('id, content_text').in('id', hotTakePostIds)
      : Promise.resolve({ data: [] }),
    activeHotTake.data?.id
      ? supabase
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
      : Promise.resolve({ data: [] }),
  ])

  let userLikedPostIds = new Set<string>()
  postLikesResult.data?.forEach((row: { target_id: string }) => userLikedPostIds.add(row.target_id))

  let commentCountByPostId: Record<string, number> = {}
  commentRowsResult.data?.forEach((row: { post_id: string }) => {
    commentCountByPostId[row.post_id] = (commentCountByPostId[row.post_id] ?? 0) + 1
  })

  const hotTakePosts = hotTakePostsResult.data || []

  let enrichedFeedPosts = followingPostsList.map((p: Record<string, unknown> & { id: string; like_count?: number | null }) => ({
    ...p,
    like_count: p.like_count ?? 0,
    is_liked: userLikedPostIds.has(p.id),
    comment_count: commentCountByPostId[p.id] ?? 0,
  })) as Post[]

  // Enrich grid snapshot posts: fetch grid type and entity data for embedded GridDisplayCard
  const gridSnapshotPostGridIds = enrichedFeedPosts
    .filter((p) => p.grid_id && Array.isArray(p.grid_snapshot) && p.grid_snapshot.length > 0)
    .map((p) => p.grid_id as string)
  if (gridSnapshotPostGridIds.length > 0) {
    const { data: snapshotGrids } = await supabase
      .from('grids')
      .select('id, type')
      .in('id', [...new Set(gridSnapshotPostGridIds)])
    const gridsById = new Map((snapshotGrids || []).map((g: { id: string; type: string }) => [g.id, g]))
    const snapshotDriverIds = new Set<string>()
    const snapshotTeamIds = new Set<string>()
    const snapshotTrackIds = new Set<string>()
    for (const post of enrichedFeedPosts) {
      if (!post.grid_id || !Array.isArray(post.grid_snapshot)) continue
      const grid = gridsById.get(post.grid_id) as { type: string } | undefined
      if (!grid) continue
      for (const item of post.grid_snapshot) {
        if (grid.type === 'driver') snapshotDriverIds.add(item.id)
        else if (grid.type === 'team') snapshotTeamIds.add(item.id)
        else if (grid.type === 'track') snapshotTrackIds.add(item.id)
      }
    }
    const [
      { data: snapshotDrivers },
      { data: snapshotTeams },
      { data: snapshotTracks },
    ] = await Promise.all([
      snapshotDriverIds.size > 0
        ? supabase.from('drivers').select('id, name, headshot_url, image_url').in('id', [...snapshotDriverIds])
        : Promise.resolve({ data: [] }),
      snapshotTeamIds.size > 0
        ? supabase.from('teams').select('id, name').in('id', [...snapshotTeamIds])
        : Promise.resolve({ data: [] }),
      snapshotTrackIds.size > 0
        ? supabase.from('tracks').select('id, name, location, country, circuit_ref').in('id', [...snapshotTrackIds])
        : Promise.resolve({ data: [] }),
    ])
    const driversById = new Map((snapshotDrivers || []).map((d: { id: string }) => [d.id, d]))
    const teamsById = new Map((snapshotTeams || []).map((t: { id: string }) => [t.id, t]))
    const tracksById = new Map((snapshotTracks || []).map((t: { id: string }) => [t.id, t]))
    enrichedFeedPosts = enrichedFeedPosts.map((p) => {
      if (!p.grid_id || !Array.isArray(p.grid_snapshot)) return p
      const grid = gridsById.get(p.grid_id) as { type: 'driver' | 'team' | 'track' } | undefined
      if (!grid) return p
      const enrichedItems = p.grid_snapshot.map((item: { id: string; name: string }) => {
        if (grid.type === 'driver') {
          const d = driversById.get(item.id) as { headshot_url?: string | null; image_url?: string | null } | undefined
          return {
            ...item,
            headshot_url: d?.headshot_url ?? null,
            image_url: d?.headshot_url ?? d?.image_url ?? null,
          }
        }
        if (grid.type === 'team') {
          return { ...item }
        }
        if (grid.type === 'track') {
          const t = tracksById.get(item.id) as { location?: string | null; country?: string | null; circuit_ref?: string | null } | undefined
          return {
            ...item,
            location: t?.location ?? null,
            country: t?.country ?? null,
            circuit_ref: t?.circuit_ref ?? null,
          }
        }
        return item
      })
      return {
        ...p,
        embeddedGrid: {
          id: p.grid_id,
          type: grid.type,
          ranked_items: enrichedItems,
          blurb: null,
        },
      }
    })
  }

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

  // Build parentPageByKey from second-batch results (driver/team/track entities + hot takes)
  const parentPageByKey: Record<
    string,
    { name: string; href: string; type: string; content_text?: string }
  > = {}
  ;(driverEntities.data || []).forEach((d: { id: string; name: string }) => {
    parentPageByKey[`driver:${d.id}`] = {
      name: d.name,
      href: `/drivers/${encodeURIComponent(toEntitySlug(d.name))}`,
      type: 'driver',
    }
  })
  ;(teamEntities.data || []).forEach((t: { id: string; name: string }) => {
    parentPageByKey[`team:${t.id}`] = {
      name: t.name,
      href: `/teams/${encodeURIComponent(toEntitySlug(t.name))}`,
      type: 'team',
    }
  })
  ;(trackEntities.data || []).forEach((t: { id: string; name: string }) => {
    parentPageByKey[`track:${t.id}`] = {
      name: t.name,
      href: `/tracks/${encodeURIComponent(getTrackSlug(t.name))}`,
      type: 'track',
    }
  })

  // Hot take context for "Replied to: [title]" on feed posts (from second batch)
  const truncate = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len).trimEnd() + '…'
  ;(hotTakesResult.data || []).forEach((ht: { id: string; content_text: string }) => {
    parentPageByKey[`hot_take:${ht.id}`] = {
      name: truncate(ht.content_text || 'Hot take', 80),
      href: '/feed',
      type: 'hot_take',
      content_text: ht.content_text || 'Hot take',
    }
  })

  // Poll context for "Replied to: [question]" on feed posts
  const truncatePoll = (s: string, len: number) =>
    s.length <= len ? s : s.slice(0, len).trimEnd() + '…'
  Object.entries(embeddedPollsByPollId).forEach(([pollId, { poll }]) => {
    parentPageByKey[`poll:${pollId}`] = {
      name: truncatePoll(poll.question || 'Poll', 80),
      href: `/podiums?poll=${encodeURIComponent(pollId)}`,
      type: 'poll',
    }
  })

  // Enrich feed grids: only completed driver grids (no team/track in main feed)
  const feedGridsRawAll = followingGrids.data || []
  let feedGridsRaw = feedGridsRawAll.filter(
    (grid: { type: string; ranked_items?: unknown[] }) =>
      grid.type === 'driver' &&
      Array.isArray(grid.ranked_items) &&
      grid.ranked_items.length > 0
  )
  // Deduplication: exclude grids that have a post with grid_id within 1 min of grid.updated_at
  const gridSnapshotPosts = enrichedFeedPosts.filter(
    (p) => p.grid_id && p.created_at
  ) as Array<{ grid_id: string; created_at: string }>
  const gridIdToPostCreatedAt = new Map(
    gridSnapshotPosts.map((p) => [p.grid_id, p.created_at])
  )
  feedGridsRaw = feedGridsRaw.filter((grid: { id: string; updated_at?: string | null }) => {
    const postCreatedAt = gridIdToPostCreatedAt.get(grid.id)
    if (!postCreatedAt || !grid.updated_at) return true
    const postTime = new Date(postCreatedAt).getTime()
    const gridTime = new Date(grid.updated_at).getTime()
    // Exclude grid when a post with this grid_id exists within 1 min of grid update
    return Math.abs(postTime - gridTime) > 60 * 1000
  })
  const feedGridIds = feedGridsRaw.map((grid: { id: string }) => grid.id)
  const driverIds = Array.from(
    new Set(
      feedGridsRaw.flatMap((grid: { ranked_items: Array<{ id: string }> }) =>
        Array.isArray(grid.ranked_items) ? grid.ranked_items.map((item) => item.id) : []
      )
    )
  )
  const trackIds: string[] = []

  const [
    { data: driversData },
    { data: tracksData },
    { data: likesData },
    { data: commentsData },
    { data: userLikesData },
  ] = await Promise.all([
    driverIds.length > 0
      ? supabase.from('drivers').select('id, name, headshot_url, image_url').in('id', driverIds)
      : Promise.resolve({ data: [] }),
    trackIds.length > 0
      ? supabase
          .from('tracks')
          .select('id, name, location, country, circuit_ref')
          .in('id', trackIds)
      : Promise.resolve({ data: [] }),
    feedGridIds.length > 0
      ? supabase.from('grid_likes').select('grid_id').in('grid_id', feedGridIds)
      : Promise.resolve({ data: [] }),
    feedGridIds.length > 0
      ? supabase.from('grid_slot_comments').select('grid_id').in('grid_id', feedGridIds)
      : Promise.resolve({ data: [] }),
    feedGridIds.length > 0
      ? supabase
          .from('grid_likes')
          .select('grid_id')
          .eq('user_id', session.user.id)
          .in('grid_id', feedGridIds)
      : Promise.resolve({ data: [] }),
  ])

  const driversById = new Map(
    (driversData || []).map((driver: { id: string }) => [driver.id, driver])
  )
  const tracksById = new Map(
    (tracksData || []).map((track: { id: string }) => [track.id, track])
  )
  const likeCounts = (likesData || []).reduce((acc: Record<string, number>, row: { grid_id: string }) => {
    acc[row.grid_id] = (acc[row.grid_id] || 0) + 1
    return acc
  }, {})
  const commentCounts = (commentsData || []).reduce(
    (acc: Record<string, number>, row: { grid_id: string }) => {
      acc[row.grid_id] = (acc[row.grid_id] || 0) + 1
      return acc
    },
    {}
  )
  const userLikedGridIds = new Set((userLikesData || []).map((row: { grid_id: string }) => row.grid_id))

  const enrichedFeedGrids = feedGridsRaw.map(
    (grid: Record<string, unknown> & { id: string; type: string; ranked_items: any[]; user_id: string }) => {
      const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
      const enrichedItems = rankedItems.map((item: { id: string; name: string }) => {
        if (grid.type === 'driver') {
          const driver = driversById.get(item.id) as
            | { headshot_url?: string | null; image_url?: string | null }
            | undefined
          return {
            ...item,
            headshot_url: driver?.headshot_url || null,
            image_url: driver?.headshot_url || driver?.image_url || null,
          }
        }
        if (grid.type === 'track') {
          const track = tracksById.get(item.id) as
            | { location?: string | null; country?: string | null; circuit_ref?: string | null }
            | undefined
          return {
            ...item,
            image_url: null,
            location: track?.location || null,
            country: track?.country || null,
            circuit_ref: track?.circuit_ref || null,
          }
        }
        return item
      })

      const user = grid.user as Record<string, unknown> | null
      return {
        ...grid,
        ranked_items: enrichedItems,
        blurb: grid.blurb ?? null,
        like_count: likeCounts[grid.id] ?? 0,
        comment_count: commentCounts[grid.id] ?? 0,
        is_liked: userLikedGridIds.has(grid.id),
        created_at: grid.updated_at || grid.created_at,
        user: user
          ? {
              id: user.id,
              username: user.username,
              profile_image_url: user.profile_image_url ?? null,
            }
          : null,
      }
    }
  )

  const sponsorsList = (sponsors.data || []) as Array<{
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
    description: string | null
  }>
  const featuredNewsRaw = (featuredNews.data || []) as Array<{
    id: string
    title: string
    image_url: string | null
    content: string
    created_at: string
    author?: { id: string; username: string; profile_image_url: string | null } | Array<{ id: string; username: string; profile_image_url: string | null }>
  }>
  const featuredNewsList = featuredNewsRaw.map((n) => {
    const author = Array.isArray(n.author) ? n.author[0] : n.author
    return {
      id: n.id,
      title: n.title,
      image_url: n.image_url,
      content: n.content,
      created_at: n.created_at,
      username: author?.username ?? null,
      profile_image_url: author?.profile_image_url ?? null,
    }
  })

  const adminPollsList = (adminPolls.data || []) as Array<{
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
  }>
  const adminPollsForBannerList = (adminPollsForBanner.data || []).map((p) => ({
    ...p,
    options: (p as { options?: unknown[] }).options ?? [],
    created_at: (p as { created_at?: string }).created_at ?? new Date().toISOString(),
  })) as Array<{
    id: string
    question: string
    options: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
    created_at: string
  }>
  const communityPollsList = (polls.data || []) as Array<{
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    admin_id?: string | null
    created_at: string
    ends_at?: string | null
  }>
  const allActivePolls = [...adminPollsList, ...communityPollsList]
  // Banner shows only an admin poll that is explicitly marked as featured. No other polls in the spotlight banner (carousel/sidebar).
  const featuredAdminPoll = adminPollsForBannerList.find((p) => p.is_featured_podium) ?? null
  // Carousel and sidebar: only the single featured admin poll (or none). Never community polls or non-featured admin polls.
  const pollsForSpotlightBanner = featuredAdminPoll ? [featuredAdminPoll] : []

  // Fetch poll discussion posts for spotlight banner polls
  let pollDiscussionPostsByPollId: Record<string, any[]> = {}
  if (pollsForSpotlightBanner.length > 0) {
    const bannerPollIds = pollsForSpotlightBanner.map((p) => p.id)
    const { data: pollPosts } = await supabase
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
      .eq('parent_page_type', 'poll')
      .in('parent_page_id', bannerPollIds)
      .order('created_at', { ascending: false })

    if (pollPosts) {
      for (const post of pollPosts) {
        const pid = post.parent_page_id as string
        if (pid) {
          if (!pollDiscussionPostsByPollId[pid]) pollDiscussionPostsByPollId[pid] = []
          pollDiscussionPostsByPollId[pid].push(post)
        }
      }
      // Sort each poll's posts by created_at desc and limit to 20
      for (const pid of Object.keys(pollDiscussionPostsByPollId)) {
        pollDiscussionPostsByPollId[pid] = pollDiscussionPostsByPollId[pid]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 20)
      }
    }
  }

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

  // Enrich featured grid ranked_items (drivers/tracks/teams) for GridDisplayCard
  let enrichedFeaturedGrid = featuredGrid
  if (featuredGrid) {
    const fgRanked = featuredGrid.ranked_items || []
    const fgIds = fgRanked.map((i: { id?: string }) => i.id).filter(Boolean) as string[]
    if (featuredGrid.type === 'driver' && fgIds.length > 0) {
      const { data: fgDrivers } = await supabase
        .from('drivers')
        .select('id, name, headshot_url, image_url, team_id, teams:team_id(name)')
        .in('id', fgIds)
      const fgDriversById = new Map((fgDrivers || []).map((d: { id: string }) => [d.id, d]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const d = fgDriversById.get(item.id) as {
            headshot_url?: string | null
            image_url?: string | null
            name?: string
            teams?: { name?: string } | Array<{ name?: string }>
          } | undefined
          const teamName = d?.teams
            ? (Array.isArray(d.teams) ? d.teams[0]?.name : d.teams?.name)
            : null
          return {
            ...item,
            name: item.name ?? d?.name ?? '',
            headshot_url: d?.headshot_url ?? null,
            image_url: d?.headshot_url ?? d?.image_url ?? null,
            team_name: teamName ?? null,
          }
        }),
      }
    } else if (featuredGrid.type === 'track' && fgIds.length > 0) {
      const { data: fgTracks } = await supabase
        .from('tracks')
        .select('id, name, location, country, circuit_ref')
        .in('id', fgIds)
      const fgTracksById = new Map((fgTracks || []).map((t: { id: string }) => [t.id, t]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const t = fgTracksById.get(item.id) as { location?: string | null; country?: string | null; circuit_ref?: string | null; name?: string } | undefined
          return {
            ...item,
            name: item.name ?? t?.name ?? '',
            location: t?.location ?? null,
            country: t?.country ?? null,
            circuit_ref: t?.circuit_ref ?? null,
          }
        }),
      }
    } else if (featuredGrid.type === 'team' && fgIds.length > 0) {
      const { data: fgTeams } = await supabase.from('teams').select('id, name').in('id', fgIds)
      const fgTeamsById = new Map((fgTeams || []).map((t: { id: string }) => [t.id, t]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const t = fgTeamsById.get(item.id) as { name?: string } | undefined
          return { ...item, name: item.name ?? t?.name ?? '' }
        }),
      }
    }
  }

  type BannerItem =
    | { type: 'sponsor'; data: (typeof sponsorsList)[number] }
    | { type: 'featured_poll'; data: NonNullable<typeof featuredAdminPoll> }
    | { type: 'featured_story'; data: NonNullable<typeof featuredStory> }
    | { type: 'featured_grid'; data: NonNullable<typeof enrichedFeaturedGrid> }
  const bannerItems: BannerItem[] = []
  sponsorsList.forEach((sponsor) => bannerItems.push({ type: 'sponsor', data: sponsor }))
  // Only admin polls in banner; never user-submitted (community) polls
  if (featuredAdminPoll && featuredAdminPoll.admin_id != null) {
    bannerItems.push({ type: 'featured_poll', data: featuredAdminPoll })
  }
  if (featuredStory) bannerItems.push({ type: 'featured_story', data: featuredStory })
  if (enrichedFeaturedGrid) bannerItems.push({ type: 'featured_grid', data: enrichedFeaturedGrid })

  // Desktop banner: sponsors + featured grid only (no news, no featured poll — those live in the left sidebar)
  const desktopBannerItems = bannerItems.filter(
    (item) => item.type !== 'featured_story' && item.type !== 'featured_poll'
  )

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-white font-display">Feed</h1>
        <h3 className="text-sm text-white/80 font-sans mb-4">Post. React. Express Yourself.</h3>
      </div>

      {sponsorsList.length > 0 && (
        <div className="relative z-10 hidden w-full border-y border-white/10 bg-black/20 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-nowrap items-stretch gap-6 overflow-x-hidden justify-center items-center">
            {desktopBannerItems.map((item) => (
              <div
                key={`sponsor-${item.data.id}`}
                className={' flex-shrink-0'}>
                {item.type === 'sponsor' && (
                  <SponsorCard sponsor={item.data} variant="banner" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 pt-0 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 pt-6">
        <aside className="hidden">
          <FeedHighlightedSidebar
            spotlight={{ hot_take: activeHotTake.data || null }}
            featuredGrid={enrichedFeaturedGrid}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
            polls={pollsForSpotlightBanner}
            userResponses={feedPollUserResponses}
            voteCounts={feedPollVoteCounts}
            featuredNews={featuredNewsList}
            discussionPosts={hotTakePosts}
            pollDiscussionPostsByPollId={pollDiscussionPostsByPollId}
          />
        </aside>
        <div className="space-y-6 md:space-y-0">
          <div className="relative z-10 md:mb-10">
            <SpotlightCarousel
              spotlight={{
                hot_take: activeHotTake.data || null,
                featured_grid: enrichedFeaturedGrid,
              }}
              supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
              polls={pollsForSpotlightBanner}
              userResponses={feedPollUserResponses}
              voteCounts={feedPollVoteCounts}
              discussionPosts={hotTakePosts}
              pollDiscussionPostsByPollId={pollDiscussionPostsByPollId}
              sponsors={sponsorsList}
              featuredNews={featuredNewsList}
            />
          </div>
          <FeedContent
            posts={enrichedFeedPosts}
            grids={enrichedFeedGrids as Grid[]}
            gridComments={[]}
            embeddedPollsByPollId={embeddedPollsByPollId}
            parentPageByKey={parentPageByKey}
            communityPolls={communityPollsList}
            pollUserResponses={feedPollUserResponses}
            pollVoteCounts={feedPollVoteCounts}
            supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
            currentUserId={session.user.id}
            featuredNews={featuredStory ? featuredNewsList.slice(1) : featuredNewsList}
            isNewUser={isNewUser}
            hasMore={
              followingPostsList.length >= postsLimit ||
              (followingGrids.data?.length ?? 0) >= gridsLimit
            }
            currentPage={page}
          />
        </div>
        </div>
      </div>
    </div>
  )
}

type SpotlightGridType = 'driver' | 'team' | 'track'
