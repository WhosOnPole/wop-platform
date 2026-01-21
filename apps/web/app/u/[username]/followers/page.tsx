import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function FollowersPage({ params }: PageProps) {
  const { username } = await params
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, profile_image_url')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch followers
  const { data: follows } = await supabase
    .from('follows')
    .select(
      `
      follower_id,
      created_at,
      follower:profiles!follower_id (
        id,
        username,
        profile_image_url
      )
    `
    )
    .eq('following_id', profile.id)
    .order('created_at', { ascending: false })

  const followers = (follows || []).map((f) => ({
    id: f.follower_id,
    username: (f.follower as any)?.username,
    profile_image_url: (f.follower as any)?.profile_image_url,
    followed_at: f.created_at,
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href={`/u/${username}`}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Followers</h1>
          <p className="text-sm text-gray-600">{profile.username}</p>
        </div>
      </div>

      {/* Followers List */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        {followers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No followers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {followers.map((follower) => (
              <Link
                key={follower.id}
                href={`/u/${follower.username}`}
                className="flex items-center space-x-4 p-4 transition-colors hover:bg-gray-50"
              >
                {follower.profile_image_url ? (
                  <img
                    src={follower.profile_image_url}
                    alt={follower.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    <span className="text-lg font-semibold">
                      {follower.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{follower.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
