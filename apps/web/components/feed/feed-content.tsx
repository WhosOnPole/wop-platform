import Link from 'next/link'
import { LikeButton } from '@/components/discussion/like-button'
import { getAvatarUrl } from '@/utils/avatar'
import { FeedPostCommentSection } from './feed-post-comment-section'
import { FeedPostActionsMenu } from './feed-post-actions-menu'
import { F1InstagramEmbed } from './f1-instagram-embed'

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
}

interface Grid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment: string | null
  ranked_items: any[]
  created_at: string
  user: User | null
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

interface FeedContentProps {
  posts: Post[]
  grids: Grid[]
  featuredNews: NewsStory[]
}

type FeedItem =
  | (Post & { contentType: 'post' })
  | (Grid & { contentType: 'grid' })
  | (NewsStory & { contentType: 'news' })

export function FeedContent({ posts, grids, featuredNews }: FeedContentProps) {
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
              <div className="mb-4 flex items-center space-x-3">
                <img
                  src={getAvatarUrl(post.user?.profile_image_url)}
                  alt={post.user?.username ?? ''}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
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
              <p className="text-white/90">{post.content}</p>
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
                />
                <FeedPostActionsMenu
                  postId={post.id}
                  postAuthorId={post.user?.id ?? null}
                />
              </div>
            </div>
          )
        }

        if (item.contentType === 'grid') {
          const grid = item
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
                    Top {grid.type === 'driver' ? 'Drivers' : grid.type === 'team' ? 'Teams' : 'Tracks'}
                  </p>
                </div>
              </div>
              {grid.comment && (
                <p className="mb-4 italic text-white/90">&quot;{grid.comment}&quot;</p>
              )}
              <div className="space-y-2">
                {Array.isArray(grid.ranked_items) &&
                  grid.ranked_items.slice(0, 3).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 rounded-md bg-white/10 p-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25B4B1] text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/90">{item.name || 'Unknown'}</span>
                    </div>
                  ))}
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
    </div>
  )
}

