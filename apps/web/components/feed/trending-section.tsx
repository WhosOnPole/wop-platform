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
  href?: string
}

interface TrendingSectionProps {
  posts: Post[]
}

export function TrendingSection({ posts }: TrendingSectionProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm">
      <div className="mb-4 flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-white/80" />
        <h2 className="text-lg font-semibold text-white">What&apos;s Trending</h2>
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={post.href || '/feed'}
            className="block rounded-md p-3 text-white/90 transition-colors hover:bg-white/10"
          >
            <p className="text-sm line-clamp-2">{post.content}</p>
            <p className="mt-1 text-xs text-white/70">
              by {post.user?.username || 'Unknown'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

