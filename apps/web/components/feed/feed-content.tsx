'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl } from '@/utils/avatar'
import { FeedPostCommentSection } from './feed-post-comment-section'
import { FeedPostActionsMenu } from './feed-post-actions-menu'
import { GridDisplayCard } from '@/components/profile/grid-display-card'
import { PollCard } from '@/components/polls/poll-card'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

export interface Post {
  id: string
  content: string
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
  embeddedPollsByPollId?: Record<string, EmbeddedPollData>
  featuredNews: NewsStory[]
  supabaseUrl?: string
  currentUserId?: string
}

type FeedItem =
  | (Post & { contentType: 'post' })
  | (Grid & { contentType: 'grid' })
  | (NewsStory & { contentType: 'news' })

export function FeedContent({
  posts,
  grids,
  embeddedPollsByPollId = {},
  featuredNews,
  supabaseUrl,
  currentUserId,
}: FeedContentProps) {
  const router = useRouter()
  // Combine and sort all non-poll content by created_at
  const allContent: FeedItem[] = [
    ...posts.map((p) => ({ ...p, contentType: 'post' as const })),
    ...grids.map((g) => ({ ...g, contentType: 'grid' as const })),
    ...featuredNews.map((n) => ({ ...n, contentType: 'news' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const hasContent = allContent.length > 0

  if (!hasContent) {
    return (
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
  }

  return (
    <div className="space-y-6">
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
                  <img
                    src={getAvatarUrl(post.user?.profile_image_url)}
                    alt={post.user?.username ?? ''}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
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
              <p className="text-white/90">{post.content}</p>
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
                <img
                  src={getAvatarUrl(grid.user?.profile_image_url)}
                  alt={grid.user?.username ?? ''}
                  className="h-10 w-10 rounded-full object-cover"
                />
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
    </div>
  )
}

