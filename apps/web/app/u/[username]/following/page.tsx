import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function FollowingPage({ params }: PageProps) {
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

  // Fetch following
  const { data: follows } = await supabase
    .from('follows')
    .select(
      `
      following_id,
      created_at,
      following:profiles!following_id (
        id,
        username,
        profile_image_url
      )
    `
    )
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })

  const following = (follows || []).map((f) => ({
    id: f.following_id,
    username: (f.following as any)?.username,
    profile_image_url: (f.following as any)?.profile_image_url,
    followed_at: f.created_at,
  }))

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/u/${username}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-[#25B4B1] hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Back to profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-display">Following</h1>
            <p className="text-sm text-white/70">{profile.username}</p>
          </div>
        </div>

        {/* Following List */}
        <div className="rounded-2xl border border-white/20 bg-white/[0.02] overflow-hidden">
          {following.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/60">Not following anyone yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {following.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.username}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5"
                >
                  <img
                    src={getAvatarUrl(user.profile_image_url)}
                    alt={user.username}
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
