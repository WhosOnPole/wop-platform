'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'
import { FeedPostCommentSection } from './feed-post-comment-section'
import { FeedPostActionsMenu } from './feed-post-actions-menu'
import { FeedDiscoverGridActionsMenu } from './feed-discover-grid-actions-menu'
import { FeedGridOwnerActionsMenu } from './feed-grid-owner-actions-menu'
import { GridDisplayCard } from '@/components/profile/grid-display-card'
import { PollCard } from '@/components/polls/poll-card'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getViewGridLabel } from '@/utils/grid-labels'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

export interface Post {
  id: string
  content: string
  image_url?: string | null
  created_at: string
  user: User | null
  like_count?: number
  is_liked?: boolean
  comment_count?: number
  parent_page_type?: string | null
  parent_page_id?: string | null
  grid_id?: string | null
  grid_snapshot?: Array<{ id: string; name: string }> | null
  embeddedGrid?: {
    id: string
    type: 'driver' | 'team' | 'track'
    ranked_items: Array<{
      id: string
      name: string
      headshot_url?: string | null
      image_url?: string | null
      location?: string | null
      country?: string | null
      circuit_ref?: string | null
    }>
    blurb?: string | null
  } | null
}

export interface Grid {
  id: string
  user_id?: string
  type: string
  comment?: string | null
  blurb?: string | null
  ranked_items: any[]
  created_at: string
  updated_at?: string | null
  user: User | null
  like_count?: number
  comment_count?: number
  is_liked?: boolean
}

export interface GridCommentItem {
  id: string
  grid_id: string
  rank_index: number
  content: string
  created_at: string
  user: User | null
  grid: { id: string; type: string } | null
}

interface Poll {
  id: string
  question: string
  options: any[]
  created_at: string
}

interface StandalonePoll {
  id: string
  question: string
  options?: unknown[]
  is_featured_podium?: boolean
  created_at: string
  ends_at?: string | null
  admin_id?: string | null
}

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
}

export interface EmbeddedPollData {
  poll: {
    id: string
    question: string
    options?: unknown[]
    is_featured_podium?: boolean
    created_at: string
    ends_at?: string | null
  }
  userResponse: string | undefined
  voteCounts: Record<string, number>
}

interface FeedContentProps {
  posts: Post[]
  grids: Grid[]
  gridComments?: GridCommentItem[]
  embeddedPollsByPollId?: Record<string, EmbeddedPollData>
  parentPageByKey?: Record<
    string,
    { name: string; href: string; type: string; content_text?: string }
  >
  featuredNews: NewsStory[]
  communityPolls?: StandalonePoll[]
  pollUserResponses?: Record<string, string>
  pollVoteCounts?: Record<string, Record<string, number>>
  supabaseUrl?: string
  currentUserId?: string
  isNewUser?: boolean
}

type FeedItem =
  | (Post & { contentType: 'post' })
  | (Grid & { contentType: 'grid' })
  | (GridCommentItem & { contentType: 'grid_comment' })
  | (NewsStory & { contentType: 'news' })
  | (StandalonePoll & { contentType: 'poll' })

const DISCOVERY_LIMIT = 15
const FEED_TAB_STORAGE_KEY = 'feed-active-tab'

type FeedTab = 'following' | 'discovery'

function getStoredFeedTab(): FeedTab {
  if (typeof window === 'undefined') return 'following'
  const stored = window.localStorage.getItem(FEED_TAB_STORAGE_KEY)
  return stored === 'discovery' ? 'discovery' : 'following'
}

export function FeedContent({
  posts,
  grids,
  gridComments = [],
  embeddedPollsByPollId = {},
  parentPageByKey = {},
  featuredNews,
  communityPolls = [],
  pollUserResponses = {},
  pollVoteCounts = {},
  supabaseUrl,
  currentUserId,
  isNewUser = false,
}: FeedContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasLoadedDiscoveryRef = useRef(false)
  const [discoveryItems, setDiscoveryItems] = useState<FeedItem[]>([])
  const [discoveryParentPageByKey, setDiscoveryParentPageByKey] = useState<
    Record<string, { name: string; href: string; type: string; content_text?: string }>
  >({})
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false)
  const [hasLoadedDiscovery, setHasLoadedDiscovery] = useState(false)

  const [activeTab, setActiveTab] = useState<FeedTab>(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'discovery' || tabParam === 'following') return tabParam
    return getStoredFeedTab()
  })

  const setFeedTab = useCallback((tab: FeedTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FEED_TAB_STORAGE_KEY, tab)
    }
    router.replace(`/feed?tab=${tab}`, { scroll: false })
  }, [router])

  const excludePostIds = useMemo(() => posts.map((p) => p.id), [posts])
  const excludeGridIds = useMemo(() => grids.map((g) => g.id), [grids])

  const fetchDiscovery = useCallback(async () => {
    if (hasLoadedDiscoveryRef.current) return
    hasLoadedDiscoveryRef.current = true
    setIsLoadingDiscovery(true)
    setHasLoadedDiscovery(true)

    try {
      const supabase = createClientComponentClient()
      const { data: { session } } = await supabase.auth.getSession()

      // Fetch posts from all users (exclude feed ids client-side)
      const { data: discoverPosts } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(DISCOVERY_LIMIT * 2)

      // Fetch grids from all users (exclude feed ids client-side)
      const { data: discoverGrids } = await supabase
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
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(DISCOVERY_LIMIT * 2)

      const allowedPostParentTypes = ['hot_take', 'poll', 'profile', 'driver', 'team'] as const
      const postsList = ((discoverPosts || []) as Array<Record<string, unknown> & { id: string; like_count?: number | null; user_id?: string }>)
        .filter((p) => !excludePostIds.includes(p.id))
        .filter(
          (p) =>
            p.parent_page_type == null ||
            allowedPostParentTypes.includes(p.parent_page_type as (typeof allowedPostParentTypes)[number])
        )
        .slice(0, DISCOVERY_LIMIT)
      const gridsList = ((discoverGrids || []) as Array<Record<string, unknown> & { id: string; type: string; ranked_items: any[]; user_id?: string }>)
        .filter((g) => !excludeGridIds.includes(g.id))
        .filter(
          (g) =>
            g.type === 'driver' &&
            Array.isArray(g.ranked_items) &&
            g.ranked_items.length > 0
        )
        .slice(0, DISCOVERY_LIMIT)

      // Fetch hot take context for hot take posts (existing posts from any user)
      const hotTakeIds = [
        ...new Set(
          postsList
            .filter(
              (p) =>
                p.parent_page_type === 'hot_take' &&
                p.parent_page_id &&
                typeof p.parent_page_id === 'string'
            )
            .map((p) => p.parent_page_id as string)
        ),
      ]
      let discoveryParentPageByKey: Record<
        string,
        { name: string; href: string; type: string; content_text?: string }
      > = {}
      if (hotTakeIds.length > 0) {
        const { data: hotTakes } = await supabase
          .from('hot_takes')
          .select('id, content_text')
          .in('id', hotTakeIds)
        const truncate = (s: string, len: number) =>
          s.length <= len ? s : s.slice(0, len).trimEnd() + '…'
        ;(hotTakes || []).forEach((ht: { id: string; content_text: string }) => {
          discoveryParentPageByKey[`hot_take:${ht.id}`] = {
            name: truncate(ht.content_text || 'Hot take', 80),
            href: '/feed',
            type: 'hot_take',
            content_text: ht.content_text || 'Hot take',
          }
        })
      }
      setDiscoveryParentPageByKey(discoveryParentPageByKey)

      // Enrich grids with driver/track data
      const driverIds = Array.from(
        new Set(
          gridsList
            .filter((g) => g.type === 'driver')
            .flatMap((g) =>
              Array.isArray(g.ranked_items) ? g.ranked_items.map((item: { id: string }) => item.id) : []
            )
        )
      )
      const trackIds = Array.from(
        new Set(
          gridsList
            .filter((g) => g.type === 'track')
            .flatMap((g) =>
              Array.isArray(g.ranked_items) ? g.ranked_items.map((item: { id: string }) => item.id) : []
            )
        )
      )

      const [driversRes, tracksRes, gridLikesRes, gridCommentsRes] = await Promise.all([
        driverIds.length > 0 ? supabase.from('drivers').select('id, name, headshot_url, image_url').in('id', driverIds) : Promise.resolve({ data: [] }),
        trackIds.length > 0 ? supabase.from('tracks').select('id, name, location, country, circuit_ref').in('id', trackIds) : Promise.resolve({ data: [] }),
        gridsList.length > 0 ? supabase.from('grid_likes').select('grid_id').in('grid_id', gridsList.map((g) => g.id)) : Promise.resolve({ data: [] }),
        gridsList.length > 0 ? supabase.from('grid_slot_comments').select('grid_id').in('grid_id', gridsList.map((g) => g.id)) : Promise.resolve({ data: [] }),
      ])

      // Post comment counts and user like state
      const postIds = postsList.map((p) => p.id)
      const [postCommentCounts, userPostLikes, userGridLikes] = await Promise.all([
        postIds.length > 0 ? supabase.from('comments').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
        session && postIds.length > 0 ? supabase.from('votes').select('target_id').eq('user_id', session.user.id).eq('target_type', 'post').in('target_id', postIds) : Promise.resolve({ data: [] }),
        session && gridsList.length > 0 ? supabase.from('grid_likes').select('grid_id').eq('user_id', session.user.id).in('grid_id', gridsList.map((g) => g.id)) : Promise.resolve({ data: [] }),
      ])

      const driversById = new Map((driversRes.data || []).map((d: { id: string }) => [d.id, d]))
      const tracksById = new Map((tracksRes.data || []).map((t: { id: string }) => [t.id, t]))
      const gridLikeCountMap = (gridLikesRes.data || []).reduce((acc: Record<string, number>, r: { grid_id: string }) => {
        acc[r.grid_id] = (acc[r.grid_id] || 0) + 1
        return acc
      }, {})
      const gridCommentCountMap = (gridCommentsRes.data || []).reduce((acc: Record<string, number>, r: { grid_id: string }) => {
        acc[r.grid_id] = (acc[r.grid_id] || 0) + 1
        return acc
      }, {})
      const commentCountByPostId = (postCommentCounts.data || []).reduce((acc: Record<string, number>, r: { post_id: string }) => {
        acc[r.post_id] = (acc[r.post_id] || 0) + 1
        return acc
      }, {})
      const userLikedPostIds = new Set((userPostLikes.data || []).map((r: { target_id: string }) => r.target_id))
      const userLikedGridIds = new Set((userGridLikes.data || []).map((r: { grid_id: string }) => r.grid_id))

      // Enrich grid snapshot posts for discovery
      const snapshotPostGridIds = [...new Set(
        postsList
          .filter((p: Record<string, unknown>) => p.grid_id && Array.isArray(p.grid_snapshot) && (p.grid_snapshot as unknown[]).length > 0)
          .map((p: Record<string, unknown>) => p.grid_id as string)
      )]
      let snapshotGridsById = new Map<string, { type: string }>()
      let snapshotDriversById = new Map<string, { headshot_url?: string | null; image_url?: string | null }>()
      let snapshotTeamsById = new Map<string, { name?: string }>()
      let snapshotTracksById = new Map<string, { location?: string | null; country?: string | null; circuit_ref?: string | null }>()
      if (snapshotPostGridIds.length > 0) {
        const { data: snapGrids } = await supabase.from('grids').select('id, type').in('id', snapshotPostGridIds)
        snapshotGridsById = new Map((snapGrids || []).map((g: { id: string; type: string }) => [g.id, g]))
        const snapDriverIds = new Set<string>()
        const snapTeamIds = new Set<string>()
        const snapTrackIds = new Set<string>()
        for (const p of postsList) {
          const gridId = (p as Record<string, unknown>).grid_id as string | undefined
          const snapshot = (p as Record<string, unknown>).grid_snapshot as Array<{ id: string }> | undefined
          if (!gridId || !Array.isArray(snapshot)) continue
          const g = snapshotGridsById.get(gridId)
          if (!g) continue
          for (const item of snapshot) {
            if (g.type === 'driver') snapDriverIds.add(item.id)
            else if (g.type === 'team') snapTeamIds.add(item.id)
            else if (g.type === 'track') snapTrackIds.add(item.id)
          }
        }
        const [sd, st, str] = await Promise.all([
          snapDriverIds.size > 0 ? supabase.from('drivers').select('id, headshot_url, image_url').in('id', [...snapDriverIds]) : Promise.resolve({ data: [] }),
          snapTeamIds.size > 0 ? supabase.from('teams').select('id, name').in('id', [...snapTeamIds]) : Promise.resolve({ data: [] }),
          snapTrackIds.size > 0 ? supabase.from('tracks').select('id, location, country, circuit_ref').in('id', [...snapTrackIds]) : Promise.resolve({ data: [] }),
        ])
        snapshotDriversById = new Map(
          (sd.data || []).map((d: { id: string; headshot_url?: string | null; image_url?: string | null }) => [
            d.id,
            { headshot_url: d.headshot_url ?? null, image_url: d.image_url ?? null },
          ])
        )
        snapshotTeamsById = new Map((st.data || []).map((t: { id: string; name?: string }) => [t.id, { name: t.name }]))
        snapshotTracksById = new Map(
          (str.data || []).map((t: { id: string; location?: string | null; country?: string | null; circuit_ref?: string | null }) => [
            t.id,
            { location: t.location ?? null, country: t.country ?? null, circuit_ref: t.circuit_ref ?? null },
          ])
        )
      }

      const enrichedPosts: FeedItem[] = postsList.map((p) => {
        const base = {
          ...p,
          contentType: 'post' as const,
          like_count: p.like_count ?? 0,
          is_liked: userLikedPostIds.has(p.id),
          comment_count: commentCountByPostId[p.id] ?? 0,
        }
        const gridId = (p as Record<string, unknown>).grid_id as string | undefined
        const snapshot = (p as Record<string, unknown>).grid_snapshot as Array<{ id: string; name: string }> | undefined
        if (!gridId || !Array.isArray(snapshot) || snapshot.length === 0) return base as FeedItem
        const grid = snapshotGridsById.get(gridId) as { type: 'driver' | 'team' | 'track' } | undefined
        if (!grid) return base as FeedItem
        const enrichedItems = snapshot.map((item) => {
          if (grid.type === 'driver') {
            const d = snapshotDriversById.get(item.id)
            return { ...item, headshot_url: d?.headshot_url ?? null, image_url: d?.headshot_url ?? d?.image_url ?? null }
          }
          if (grid.type === 'track') {
            const t = snapshotTracksById.get(item.id)
            return { ...item, location: t?.location ?? null, country: t?.country ?? null, circuit_ref: t?.circuit_ref ?? null }
          }
          return item
        })
        return {
          ...base,
          embeddedGrid: { id: gridId, type: grid.type, ranked_items: enrichedItems, blurb: null },
        } as FeedItem
      })

      const enrichedGrids: FeedItem[] = gridsList.map((grid) => {
        const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
        const enrichedItems = rankedItems.map((item: { id: string; name: string }) => {
          if (grid.type === 'driver') {
            const driver = driversById.get(item.id) as { headshot_url?: string | null; image_url?: string | null } | undefined
            return { ...item, headshot_url: driver?.headshot_url || null, image_url: driver?.headshot_url || driver?.image_url || null }
          }
          if (grid.type === 'track') {
            const track = tracksById.get(item.id) as { location?: string | null; country?: string | null; circuit_ref?: string | null } | undefined
            return { ...item, image_url: null, location: track?.location || null, country: track?.country || null, circuit_ref: track?.circuit_ref || null }
          }
          return item
        })
        const userRaw = grid.user
        const user = Array.isArray(userRaw) ? userRaw[0] : userRaw
        const userObj = user as Record<string, unknown> | null
        return {
          ...grid,
          ranked_items: enrichedItems,
          blurb: (typeof grid.blurb === 'string' ? grid.blurb : null) as string | null,
          like_count: gridLikeCountMap[grid.id] ?? 0,
          comment_count: gridCommentCountMap[grid.id] ?? 0,
          is_liked: userLikedGridIds.has(grid.id),
          created_at: (grid.updated_at || grid.created_at) as string,
          user: userObj ? { id: userObj.id, username: userObj.username, profile_image_url: userObj.profile_image_url ?? null } : null,
          contentType: 'grid' as const,
        }
      }) as FeedItem[]

      const combined = [...enrichedPosts, ...enrichedGrids].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setDiscoveryItems(combined.slice(0, DISCOVERY_LIMIT * 2))
      setHasLoadedDiscovery(true)
    } catch {
      hasLoadedDiscoveryRef.current = false
      setHasLoadedDiscovery(false)
    } finally {
      setIsLoadingDiscovery(false)
    }
  }, [excludePostIds, excludeGridIds])

  // Sync tab from URL (e.g. back/forward or shared link)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'discovery' || tabParam === 'following') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Load discovery when user switches to Discovery tab
  useEffect(() => {
    if (activeTab === 'discovery') fetchDiscovery()
  }, [activeTab, fetchDiscovery])

  // Combine and sort all content (posts, grids, grid comments, news, community polls) chronologically
  const allContent: FeedItem[] = [
    ...posts.map((p) => ({ ...p, contentType: 'post' as const })),
    ...grids.map((g) => ({ ...g, contentType: 'grid' as const })),
    ...gridComments.map((c) => ({ ...c, contentType: 'grid_comment' as const })),
    ...featuredNews.map((n) => ({ ...n, contentType: 'news' as const })),
    ...communityPolls.map((p) => ({ ...p, contentType: 'poll' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasContent = allContent.length > 0

  const emptyStateBlock = (
    <div className="rounded-lg border border-white/10 bg-black/40 p-12 text-center shadow backdrop-blur-sm">
      <p className="text-white/90">
        Start your journey by exploring drivers, teams and tracks!
      </p>
      <Link
        href="/pitlane"
        className="mt-4 inline-block text-[#25B4B1] hover:text-[#25B4B1]/90"
      >
        Explore Drivers, Teams & Tracks →
      </Link>
      <p className="mt-4 text-sm text-white/70">
        Or try Discovery to see posts and grids from everyone.
      </p>
      <button
        type="button"
        onClick={() => setFeedTab('discovery')}
        className="mt-2 text-[#25B4B1] hover:underline"
      >
        Switch to Discovery →
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <nav
        className="flex w-full border-b border-white/20 mt-12"
        role="tablist"
        aria-label="Feed tabs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'following'}
          onClick={() => setFeedTab('following')}
          className={`flex flex-1 items-center justify-center px-4 py-2.5 text-xs uppercase tracking-wide transition border-b-2 -mb-px ${
            activeTab === 'following'
              ? 'border-bright-teal text-white'
              : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
          }`}
        >
          Following
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'discovery'}
          onClick={() => setFeedTab('discovery')}
          className={`flex flex-1 items-center justify-center px-4 py-2.5 text-xs uppercase tracking-wide transition border-b-2 -mb-px ${
            activeTab === 'discovery'
              ? 'border-bright-teal text-white'
              : 'border-transparent text-white/60 hover:text-white/80 hover:border-white/30'
          }`}
        >
          Discovery
        </button>
      </nav>

      {activeTab === 'following' && (
        <>
          {!hasContent && emptyStateBlock}
          {hasContent &&
            allContent.map((item) => {
        if (item.contentType === 'post') {
          const post = item
          return (
            <div
              key={`post-${post.id}`}
              className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  <div
                    className={`h-10 w-10 shrink-0 rounded-full overflow-hidden ${
                      isDefaultAvatar(post.user?.profile_image_url)
                        ? 'bg-white border border-gray-200'
                        : ''
                    }`}
                  >
                    <img
                      src={getAvatarUrl(post.user?.profile_image_url)}
                      alt={post.user?.username ?? ''}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/u/${post.user?.username || 'unknown'}`}
                      className="font-medium text-white/90 hover:text-white"
                    >
                      {post.user?.username || 'Unknown'}
                    </Link>
                    <p className="text-xs text-white/70">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <FeedPostActionsMenu
                  postId={post.id}
                  postAuthorId={post.user?.id ?? null}
                />
              </div>
              {post.parent_page_type &&
                post.parent_page_id &&
                parentPageByKey[`${post.parent_page_type}:${post.parent_page_id}`] &&
                (() => {
                  const ctx = parentPageByKey[`${post.parent_page_type}:${post.parent_page_id}`]
                  // Poll and hot take show embedded context; no "Replied to" line needed
                  if (ctx.type === 'poll' || ctx.type === 'hot_take') return null
                  return (
                    <p className="mb-2 text-xs text-white/70">
                      Discussion on{' '}
                      <Link
                        href={ctx.href}
                        className="text-[#25B4B1] hover:underline"
                      >
                        {ctx.name}
                      </Link>
                    </p>
                  )
                })()}
              {post.parent_page_type === 'hot_take' &&
                post.parent_page_id &&
                (() => {
                  const ctx = parentPageByKey[`hot_take:${post.parent_page_id}`]
                  if (!ctx) return null
                  const contentText = ctx.content_text || 'Hot take'
                  return (
                    <Link
                      href="/feed"
                      className="mb-4 block rounded-md border border-white/10 bg-black/30 p-4 text-left transition-colors hover:bg-black/40"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                        Hot Take
                      </p>
                      <p className="mt-2 text-white/90">{contentText}</p>
                    </Link>
                  )
                })()}
              {post.content ? <p className="text-white/90">{post.content}</p> : null}
              {post.image_url && (
                <div className="mt-3 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image_url}
                    alt=""
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              )}
              {post.parent_page_type === 'poll' &&
                post.parent_page_id &&
                embeddedPollsByPollId[post.parent_page_id] && (() => {
                  const { poll, userResponse, voteCounts } = embeddedPollsByPollId[post.parent_page_id]
                  return (
                    <div className="mt-4">
                      <PollCard
                        poll={{
                          ...poll,
                          options: Array.isArray(poll.options) ? poll.options : [],
                          is_featured_podium: !!poll.is_featured_podium,
                          ends_at: poll.ends_at ?? undefined,
                        }}
                        userResponse={userResponse}
                        voteCounts={voteCounts}
                        onVote={() => router.refresh()}
                        variant="dark"
                        className="rounded-md border border-white/10 bg-black/30 p-3"
                        compact
                        showRepost={false}
                      />
                    </div>
                  )
                })()}
              {post.embeddedGrid && (
                <div className="mt-4">
                  <GridDisplayCard
                    grid={{
                      id: post.embeddedGrid.id,
                      type: post.embeddedGrid.type,
                      ranked_items: post.embeddedGrid.ranked_items,
                      blurb: post.embeddedGrid.blurb ?? null,
                      like_count: 0,
                      comment_count: 0,
                      is_liked: false,
                    }}
                    isOwnProfile={false}
                    supabaseUrl={supabaseUrl}
                    hideActions
                  />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
                <LikeButton
                  targetId={post.id}
                  targetType="post"
                  initialLikeCount={post.like_count ?? 0}
                  initialIsLiked={post.is_liked ?? false}
                  variant="dark"
                />
                <FeedPostCommentSection
                  postId={post.id}
                  initialCommentCount={post.comment_count ?? 0}
                  panelTargetId={`comments-${post.id}`}
                />
              </div>
              <div id={`comments-${post.id}`} className="mt-3" aria-live="polite" />
            </div>
          )
        }

        if (item.contentType === 'grid') {
          const grid = item
          const typeLabel = grid.type === 'driver' ? 'Drivers' : grid.type === 'team' ? 'Teams' : 'Tracks'
          const gridType = grid.type as 'driver' | 'team' | 'track'
          const isOwnGrid = !!currentUserId && !!grid.user_id && currentUserId === grid.user_id
          const gridForDisplay = {
            id: grid.id,
            type: gridType,
            ranked_items: grid.ranked_items ?? [],
            blurb: grid.blurb ?? grid.comment ?? null,
            like_count: grid.like_count ?? 0,
            comment_count: grid.comment_count ?? 0,
            is_liked: grid.is_liked ?? false,
            previous_state: null,
            updated_at: grid.updated_at ?? grid.created_at,
          }
          return (
            <div
              key={`grid-${grid.id}`}
              className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center space-x-3">
                  <div
                    className={`h-10 w-10 shrink-0 rounded-full ${
                      grid.user?.profile_image_url
                        ? 'overflow-hidden'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(grid.user?.profile_image_url)}
                      alt={grid.user?.username ?? ''}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/u/${grid.user?.username || 'unknown'}`}
                      className="font-medium text-white/90 hover:text-white"
                    >
                      {grid.user?.username || 'Unknown'}
                    </Link>
                    <p className="text-xs text-white/70">
                      Updated their Top {typeLabel} grid · {new Date(grid.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {isOwnGrid && (
                  <FeedGridOwnerActionsMenu
                    gridUserId={grid.user_id!}
                    gridType={gridType}
                  />
                )}
              </div>
              <GridDisplayCard
                grid={gridForDisplay}
                isOwnProfile={currentUserId ? grid.user_id === currentUserId : false}
                supabaseUrl={supabaseUrl}
              />
            </div>
          )
        }

        if (item.contentType === 'poll') {
          const poll = item
          return (
            <div
              key={`poll-${poll.id}`}
              className="rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm"
            >
              <PollCard
                poll={{
                  ...poll,
                  options: Array.isArray(poll.options) ? poll.options : [],
                  is_featured_podium: poll.is_featured_podium ?? false,
                  ends_at: poll.ends_at ?? undefined,
                }}
                userResponse={pollUserResponses[poll.id]}
                voteCounts={pollVoteCounts[poll.id] ?? {}}
                onVote={() => router.refresh()}
                variant="dark"
                className="min-h-0 border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
              />
            </div>
          )
        }

        if (item.contentType === 'grid_comment') {
          const comment = item
          const gridType =
            comment.grid?.type === 'driver'
              ? 'Drivers'
              : comment.grid?.type === 'team'
                ? 'Teams'
                : comment.grid?.type === 'track'
                  ? 'Tracks'
                  : 'Grid'
          return (
            <div
              key={`grid-comment-${comment.id}`}
              className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">
                    {gridType} Grid Comments Updated!
                  </p>
                  <p className="mt-1 text-sm text-white/80">
                    Position #{comment.rank_index}: &quot;{comment.content}&quot;
                  </p>
                  <p className="mt-2 text-xs text-white/60">
                    {comment.user?.username ?? 'Someone'} ·{' '}
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={`/grid/${comment.grid_id}`}
                  className="shrink-0 text-sm font-medium text-[#25B4B1] hover:text-[#25B4B1]/90"
                >
                  {getViewGridLabel(comment.grid?.type)} →
                </Link>
              </div>
            </div>
          )
        }

        if (item.contentType === 'news') {
          const news = item
          return (
            <div
              key={`news-${news.id}`}
              className="relative flex min-h-[140px] flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
            >
              <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
                Featured Story
              </span>
              <h3 className="mt-0.5 text-xl font-bold text-white">{news.title}</h3>
              {(news as { username?: string | null }).username && (
                <p className="mt-1 text-sm text-white/70">
                  by @{(news as { username?: string }).username}
                </p>
              )}
              <Link
                href={`/story/${news.id}`}
                className="mt-auto pt-3 text-right font-medium text-white hover:text-[#25B4B1]/90"
              >
                Read more →
              </Link>
            </div>
          )
        }

        return null
      })}
        </>
      )}

      {activeTab === 'discovery' && (
        <>
          {!hasLoadedDiscovery && !isLoadingDiscovery ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#25B4B1]" />
            </div>
          ) : isLoadingDiscovery ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#25B4B1]" />
            </div>
          ) : (
            <div className="space-y-6">
              {discoveryItems.map((item) => {
                if (item.contentType === 'post') {
                  const post = item as Post & { contentType: 'post' }
                  return (
                    <div
                      key={`discover-post-${post.id}`}
                      className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                          <div
                            className={`h-10 w-10 shrink-0 rounded-full overflow-hidden ${
                              isDefaultAvatar(post.user?.profile_image_url)
                                ? 'bg-white border border-gray-200'
                                : ''
                            }`}
                          >
                            <img
                              src={getAvatarUrl(post.user?.profile_image_url)}
                              alt={post.user?.username ?? ''}
                              className="h-full w-full rounded-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/u/${post.user?.username || 'unknown'}`}
                              className="font-medium text-white/90 hover:text-white"
                            >
                              {post.user?.username || 'Unknown'}
                            </Link>
                            <p className="text-xs text-white/70">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <FeedPostActionsMenu
                          postId={post.id}
                          postAuthorId={post.user?.id ?? null}
                          showFollowButton
                        />
                      </div>
                      {post.parent_page_type &&
                        post.parent_page_id &&
                        (() => {
                          const ctx =
                            discoveryParentPageByKey[`${post.parent_page_type}:${post.parent_page_id}`] ??
                            parentPageByKey[`${post.parent_page_type}:${post.parent_page_id}`]
                          if (!ctx) return null
                          if (ctx.type === 'hot_take') return null
                          return (
                            <p className="mb-2 text-xs text-white/70">
                              Discussion on{' '}
                              <Link href={ctx.href} className="text-[#25B4B1] hover:underline">
                                {ctx.name}
                              </Link>
                            </p>
                          )
                        })()}
                      {post.parent_page_type === 'hot_take' &&
                        post.parent_page_id &&
                        (() => {
                          const ctx = discoveryParentPageByKey[`hot_take:${post.parent_page_id}`]
                          if (!ctx) return null
                          const contentText = ctx.content_text || 'Hot take'
                          return (
                            <Link
                              href="/feed"
                              className="mb-4 block rounded-md border border-white/10 bg-black/30 p-4 text-left transition-colors hover:bg-black/40"
                            >
                              <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                                Hot Take
                              </p>
                              <p className="mt-2 text-white/90">{contentText}</p>
                            </Link>
                          )
                        })()}
                      {post.content ? <p className="text-white/90">{post.content}</p> : null}
                      {post.image_url && (
                        <div className="mt-3 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.image_url}
                            alt=""
                            className="max-h-96 w-full object-contain"
                          />
                        </div>
                      )}
                      {(post as Post).embeddedGrid && (
                        <div className="mt-4">
                          <GridDisplayCard
                            grid={{
                              id: (post as Post).embeddedGrid!.id,
                              type: (post as Post).embeddedGrid!.type,
                              ranked_items: (post as Post).embeddedGrid!.ranked_items,
                              blurb: (post as Post).embeddedGrid!.blurb ?? null,
                              like_count: 0,
                              comment_count: 0,
                              is_liked: false,
                            }}
                            isOwnProfile={false}
                            supabaseUrl={supabaseUrl}
                            hideActions
                          />
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90">
                        <LikeButton
                          targetId={post.id}
                          targetType="post"
                          initialLikeCount={post.like_count ?? 0}
                          initialIsLiked={post.is_liked ?? false}
                          variant="dark"
                        />
                        <FeedPostCommentSection
                          postId={post.id}
                          initialCommentCount={post.comment_count ?? 0}
                          panelTargetId={`comments-discover-${post.id}`}
                        />
                      </div>
                      <div id={`comments-discover-${post.id}`} className="mt-3" aria-live="polite" />
                    </div>
                  )
                }
                if (item.contentType === 'grid') {
                  const grid = item as Grid & { contentType: 'grid' }
                  const typeLabel = grid.type === 'driver' ? 'Drivers' : grid.type === 'team' ? 'Teams' : 'Tracks'
                  const gridType = grid.type as 'driver' | 'team' | 'track'
                  const gridForDisplay = {
                    id: grid.id,
                    type: gridType,
                    ranked_items: grid.ranked_items ?? [],
                    blurb: grid.blurb ?? grid.comment ?? null,
                    like_count: grid.like_count ?? 0,
                    comment_count: grid.comment_count ?? 0,
                    is_liked: grid.is_liked ?? false,
                    previous_state: null,
                    updated_at: grid.updated_at ?? grid.created_at,
                  }
                  return (
                    <div
                      key={`discover-grid-${grid.id}`}
                      className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                          <div
                            className={`h-10 w-10 shrink-0 rounded-full overflow-hidden ${
                              isDefaultAvatar(grid.user?.profile_image_url)
                                ? 'bg-white border border-gray-200'
                                : ''
                            }`}
                          >
                            <img
                              src={getAvatarUrl(grid.user?.profile_image_url)}
                              alt={grid.user?.username ?? ''}
                              className="h-full w-full rounded-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/u/${grid.user?.username || 'unknown'}`}
                              className="font-medium text-white/90 hover:text-white"
                            >
                              {grid.user?.username || 'Unknown'}
                            </Link>
                            <p className="text-xs text-white/70">
                              Updated their Top {typeLabel} grid · {new Date(grid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <FeedDiscoverGridActionsMenu
                          gridId={grid.id}
                          authorId={grid.user?.id ?? null}
                        />
                      </div>
                      <GridDisplayCard
                        grid={gridForDisplay}
                        isOwnProfile={currentUserId ? grid.user_id === currentUserId : false}
                        supabaseUrl={supabaseUrl}
                      />
                    </div>
                  )
                }
                return null
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

