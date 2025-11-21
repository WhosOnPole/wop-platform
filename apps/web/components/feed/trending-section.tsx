import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

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

interface TrendingSectionProps {
  posts: Post[]
}

export function TrendingSection({ posts }: TrendingSectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">What&apos;s Trending</h2>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}`}
            className="block rounded-md p-3 hover:bg-gray-50 transition-colors"
          >
            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
            <p className="mt-1 text-xs text-gray-500">
              by {post.user?.username || 'Unknown'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

