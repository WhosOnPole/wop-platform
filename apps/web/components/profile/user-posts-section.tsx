import Link from 'next/link'
import { MessageSquare, MapPin, Users, Trophy } from 'lucide-react'

interface Post {
  id: string
  content: string
  created_at: string
  parent_page_type?: string | null
  parent_page_id?: string | null
  parent_page_name?: string | null
}

interface UserPostsSectionProps {
  posts: Post[]
  username: string
}

export function UserPostsSection({ posts, username }: UserPostsSectionProps) {
  function getContextLink(post: Post) {
    if (!post.parent_page_type || !post.parent_page_id) {
      return null
    }

    const type = post.parent_page_type
    const id = post.parent_page_id
    const name = post.parent_page_name || 'Unknown'

    if (type === 'driver') {
      return { href: `/driver/${id}`, label: `Driver: ${name}`, icon: Trophy }
    } else if (type === 'team') {
      return { href: `/team/${id}`, label: `Team: ${name}`, icon: Users }
    } else if (type === 'track') {
      return { href: `/track/${id}`, label: `Track: ${name}`, icon: MapPin }
    } else if (type === 'profile') {
      return { href: `/u/${name}`, label: `Profile: ${name}`, icon: Users }
    }

    return null
  }

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <h2 className="text-2xl font-semibold text-gray-900">{username}&apos;s Posts</h2>
      </div>
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet</p>
        ) : (
          posts.map((post) => {
            const context = getContextLink(post)
            return (
              <div
                key={post.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow hover:shadow-md transition-shadow"
              >
                {context && (
                  <div className="mb-2 flex items-center space-x-2 text-sm text-gray-600">
                    {<context.icon className="h-4 w-4" />}
                    <Link
                      href={context.href}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {context.label}
                    </Link>
                  </div>
                )}
                <p className="text-gray-700">{post.content}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

