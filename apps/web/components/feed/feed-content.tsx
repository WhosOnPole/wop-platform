import Link from 'next/link'
import { MessageSquare, Heart } from 'lucide-react'

interface User {
  id: string
  username: string
  profile_image_url: string | null
}

interface Post {
  id: string
  content: string
  created_at: string
  user: User | null
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
  polls: Poll[]
  featuredNews: NewsStory[]
}

type FeedItem =
  | (Post & { contentType: 'post' })
  | (Grid & { contentType: 'grid' })
  | (Poll & { contentType: 'poll' })
  | (NewsStory & { contentType: 'news' })

export function FeedContent({ posts, grids, polls, featuredNews }: FeedContentProps) {
  // Combine and sort all content by created_at
  const allContent: FeedItem[] = [
    ...posts.map((p) => ({ ...p, contentType: 'post' as const })),
    ...grids.map((g) => ({ ...g, contentType: 'grid' as const })),
    ...polls.map((p) => ({ ...p, contentType: 'poll' as const })),
    ...featuredNews.map((n) => ({ ...n, contentType: 'news' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (allContent.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
        <p className="text-gray-500">
          Your feed is empty. Start following users to see their content here!
        </p>
        <Link
          href="/drivers"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Explore Drivers, Teams & Tracks →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {allContent.map((item) => {
        if (item.contentType === 'post') {
          const post = item
          return (
            <div
              key={`post-${post.id}`}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-center space-x-3">
                {post.user?.profile_image_url ? (
                  <img
                    src={post.user.profile_image_url}
                    alt={post.user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-sm font-medium text-gray-600">
                      {post.user?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <Link
                    href={`/u/${post.user?.username || 'unknown'}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {post.user?.username || 'Unknown'}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-gray-700">{post.content}</p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <button className="flex items-center space-x-1 hover:text-blue-600">
                  <Heart className="h-4 w-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-1 hover:text-blue-600">
                  <MessageSquare className="h-4 w-4" />
                  <span>Comment</span>
                </button>
              </div>
            </div>
          )
        }

        if (item.contentType === 'grid') {
          const grid = item
          return (
            <div
              key={`grid-${grid.id}`}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-center space-x-3">
                {grid.user?.profile_image_url ? (
                  <img
                    src={grid.user.profile_image_url}
                    alt={grid.user.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-sm font-medium text-gray-600">
                      {grid.user?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div>
                  <Link
                    href={`/u/${grid.user?.username || 'unknown'}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {grid.user?.username || 'Unknown'}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Top {grid.type === 'driver' ? 'Drivers' : grid.type === 'team' ? 'Teams' : 'Tracks'}
                  </p>
                </div>
              </div>
              {grid.comment && (
                <p className="mb-4 italic text-gray-600">&quot;{grid.comment}&quot;</p>
              )}
              <div className="space-y-2">
                {Array.isArray(grid.ranked_items) &&
                  grid.ranked_items.slice(0, 3).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 rounded-md bg-gray-50 p-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-900">{item.name || 'Unknown'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )
        }

        if (item.contentType === 'poll') {
          const poll = item
          return (
            <div
              key={`poll-${poll.id}`}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <h3 className="mb-4 text-lg font-semibold text-gray-900">{poll.question}</h3>
              <div className="space-y-2">
                {Array.isArray(poll.options) &&
                  poll.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      {option}
                    </button>
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
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow"
            >
              {news.image_url && (
                <img
                  src={news.image_url}
                  alt={news.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold text-gray-900">{news.title}</h3>
                <p className="mb-4 text-gray-600 line-clamp-2">{news.content}</p>
                <Link
                  href={`/news/${news.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
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

