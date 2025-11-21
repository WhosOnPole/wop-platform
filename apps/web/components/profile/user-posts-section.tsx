import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

interface Post {
  id: string
  content: string
  created_at: string
}

interface UserPostsSectionProps {
  posts: Post[]
  username: string
}

export function UserPostsSection({ posts, username }: UserPostsSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <h2 className="text-2xl font-semibold text-gray-900">{username}&apos;s Posts</h2>
      </div>
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
          >
            <p className="text-gray-700">{post.content}</p>
            <p className="mt-2 text-xs text-gray-500">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

