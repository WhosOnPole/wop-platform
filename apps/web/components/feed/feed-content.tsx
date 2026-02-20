'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl } from '@/utils/avatar'
import { FeedPostCommentSection } from './feed-post-comment-section'
import { FeedPostActionsMenu } from './feed-post-actions-menu'
import { GridDisplayCard } from '@/components/profile/grid-display-card'
import { PollCard } from '@/components/polls/poll-card'
import { createClientComponentClient } from '@/utils/supabase-client'

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
  featuredNews: NewsStory[]
  supabaseUrl?: string
  currentUserId?: string
  isNewUser?: boolean
}

type FeedItem =
  | (Post & { contentType: 'post' })
  | (Grid & { contentType: 'grid' })
  | (GridCommentItem & { contentType: 'grid_comment' })
  | (NewsStory & { contentType: 'news' })

const DISCOVERY_LIMIT = 15

function DiscoverDivider() {
  return (
    <div className="flex items-center gap-4 py-4">
      <hr className="flex-1 border-white/20" />
      <span className="text-sm font-medium text-white/70">Discover</span>
      <hr className="flex-1 border-white/20" />
    </div>
  )
}

export function FeedContent({
  posts,
  grids,
  gridComments = [],
  embeddedPollsByPollId = {},
  featuredNews,
  supabaseUrl,
  currentUserId,
  isNewUser = false,
}: FeedContentProps) {
  const router = useRouter()
  const endSentinelRef = useRef<HTMLDivElement>(null)
  const hasLoadedDiscoveryRef = useRef(false)
  const [discoveryItems, setDiscoveryItems] = useState<FeedItem[]>([])
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false)
  const [hasLoadedDiscovery, setHasLoadedDiscovery] = useState(false)

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

      const postsList = ((discoverPosts || []) as Array<Record<string, unknown> & { id: string; like_count?: number | null; user_id?: string }>)
        .filter((p) => !excludePostIds.includes(p.id))
        .slice(0, DISCOVERY_LIMIT)
      const gridsList = ((discoverGrids || []) as Array<Record<string, unknown> & { id: string; type: string; ranked_items: any[]; user_id?: string }>)
        .filter((g) => !excludeGridIds.includes(g.id))
        .slice(0, DISCOVERY_LIMIT)

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

      const enrichedPosts: FeedItem[] = postsList.map((p) => ({
        ...p,
        contentType: 'post' as const,
        like_count: p.like_count ?? 0,
        is_liked: userLikedPostIds.has(p.id),
        comment_count: commentCountByPostId[p.id] ?? 0,
      })) as FeedItem[]

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

  useEffect(() => {
    const el = endSentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchDiscovery()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchDiscovery])

  // Combine and sort all non-poll content (needed early so hasContent is available for effects)
  const allContent: FeedItem[] = [
    ...posts.map((p) => ({ ...p, contentType: 'post' as const })),
    ...grids.map((g) => ({ ...g, contentType: 'grid' as const })),
    ...gridComments.map((c) => ({ ...c, contentType: 'grid_comment' as const })),
    ...featuredNews.map((n) => ({ ...n, contentType: 'news' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasContent = allContent.length > 0

  // New user with empty feed: load discover on mount so it appears below empty state
  useEffect(() => {
    if (isNewUser && !hasContent) fetchDiscovery()
  }, [isNewUser, hasContent, fetchDiscovery])

  const emptyStateBlock = (
    <div className="rounded-lg border border-white/10 bg-black/40 p-12 text-center shadow backdrop-blur-sm">
      <p className="text-white/90">
        Start creating grids to see more content here!
      </p>
      <Link
        href="/pitlane"
        className="mt-4 inline-block text-[#25B4B1] hover:text-[#25B4B1]/90"
      >
        Explore Drivers, Teams & Tracks →
      </Link>
    </div>
  )

  if (!hasContent && !isNewUser) {
    return emptyStateBlock
  }

  return (
    <div className="space-y-6">
      {!hasContent && isNewUser && emptyStateBlock}
      {hasContent && (
        <>
          {/* Vertical feed for other content */}
          {allContent.map((item) => {
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
                    className={`h-10 w-10 shrink-0 rounded-full ${
                      post.user?.profile_image_url
                        ? 'overflow-hidden'
                        : 'bg-white border border-gray-200 p-1'
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
              <div className="mb-4 flex items-center space-x-3">
                <div
                  className={`h-10 w-10 rounded-full ${
                    grid.user?.profile_image_url
                      ? 'overflow-hidden'
                      : 'bg-white border border-gray-200 p-1'
                  }`}
                >
                  <img
                    src={getAvatarUrl(grid.user?.profile_image_url)}
                    alt={grid.user?.username ?? ''}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div>
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
              <GridDisplayCard
                grid={gridForDisplay}
                isOwnProfile={currentUserId ? grid.user_id === currentUserId : false}
                supabaseUrl={supabaseUrl}
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
                  View Grid →
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
              className="overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow backdrop-blur-sm"
            >
              {news.image_url && (
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold text-white">{news.title}</h3>
                <p className="mb-4 text-white/90 line-clamp-2">{news.content}</p>
                <Link
                  href={`/news/${news.id}`}
                  className="font-medium text-[#25B4B1] hover:text-[#25B4B1]/90"
                >
                  Read more →
                </Link>
              </div>
            </div>
          )
        }

        return null
      })}

          {/* Sentinel: when scrolled into view, load discovery */}
          <div ref={endSentinelRef} className="h-1" aria-hidden="true" />
        </>
      )}

      {/* Discover section: after feed (when hasContent) or below empty state (when !hasContent && isNewUser) */}
      {(hasLoadedDiscovery || isLoadingDiscovery) && (
        <>
          <DiscoverDivider />
          {isLoadingDiscovery ? (
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
                            className={`h-10 w-10 shrink-0 rounded-full ${
                              post.user?.profile_image_url ? 'overflow-hidden' : 'bg-white border border-gray-200 p-1'
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
                        <FeedPostActionsMenu postId={post.id} postAuthorId={post.user?.id ?? null} />
                      </div>
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
                      <div className="mb-4 flex items-center space-x-3">
                        <div
                          className={`h-10 w-10 rounded-full ${
                            grid.user?.profile_image_url ? 'overflow-hidden' : 'bg-white border border-gray-200 p-1'
                          }`}
                        >
                          <img
                            src={getAvatarUrl(grid.user?.profile_image_url)}
                            alt={grid.user?.username ?? ''}
                            className="h-full w-full rounded-full object-cover"
                          />
                        </div>
                        <div>
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

