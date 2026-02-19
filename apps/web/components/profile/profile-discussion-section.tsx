'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { getAvatarUrl } from '@/utils/avatar'

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

interface ProfileDiscussionSectionProps {
  posts: Post[]
  profileId: string
  profileUsername: string
}

export function ProfileDiscussionSection({
  posts: initialPosts,
  profileId,
  profileUsername,
}: ProfileDiscussionSectionProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [newPostContent, setNewPostContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPostContent.trim()) return

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: newPostContent.trim(),
        user_id: session.user.id,
        parent_page_type: 'profile',
        parent_page_id: profileId,
      })
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
      .single()

    if (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post')
    } else {
      setPosts([data, ...posts])
      setNewPostContent('')
    }
    setIsSubmitting(false)
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-6 flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">
          Discussion on {profileUsername}&apos;s Profile
        </h2>
      </div>

      {/* Create Post Form */}
      <form onSubmit={handleCreatePost} className="mb-6">
        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder={`Write something about ${profileUsername}...`}
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>Post</span>
        </button>
      </form>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">
            No discussions yet. Be the first to post about {profileUsername}!
          </p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="border-b border-gray-200 pb-6 last:border-0">
              <div className="mb-3 flex items-center space-x-3">
                <img
                  src={getAvatarUrl(post.user?.profile_image_url)}
                  alt={post.user?.username ?? ''}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <Link
                    href={`/u/${post.user?.username || 'unknown'}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {post.user?.username || 'Unknown'}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {post.content ? <p className="text-gray-700">{post.content}</p> : null}
              {(post as { image_url?: string | null }).image_url && (
                <div className="mt-2 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(post as { image_url: string }).image_url}
                    alt=""
                    className="max-h-80 w-full object-contain"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

