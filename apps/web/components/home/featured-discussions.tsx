import Link from 'next/link'

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

interface FeaturedDiscussionsProps {
  posts: Post[]
}

export function FeaturedDiscussions({ posts }: FeaturedDiscussionsProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
        >
          <div className="mb-3 flex items-center space-x-3">
            {post.user?.profile_image_url ? (
              <img
                src={post.user.profile_image_url}
                alt={post.user.username}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
                <span className="text-xs font-medium text-gray-600">
                  {post.user?.username?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <Link
                href={`/u/${post.user?.username || 'unknown'}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {post.user?.username || 'Unknown'}
              </Link>
              <p className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <p className="text-gray-700 line-clamp-2">{post.content}</p>
          <Link
            href={`/post/${post.id}`}
            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            Read more →
          </Link>
        </div>
      ))}
    </div>
  )
}

