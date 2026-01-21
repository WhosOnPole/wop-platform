import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Trophy, Grid, MessageSquare } from 'lucide-react'
import { FollowButton } from '@/components/profile/follow-button'
import { ReportButton } from '@/components/profile/report-button'
import { UserGridsSection } from '@/components/profile/user-grids-section'
import { UserPostsSection } from '@/components/profile/user-posts-section'
import { ProfileDiscussionSection } from '@/components/profile/profile-discussion-section'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  const isOwnProfile = session?.user.id === profile.id

  // Fetch user's grids with like counts
  let gridsQuery = supabase
    .from('grids')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const { data: grids } = await gridsQuery

  // Fetch like counts and user's like status for each grid
  const gridsWithLikes = await Promise.all(
    (grids || []).map(async (grid) => {
      const { count: likeCount } = await supabase
        .from('grid_likes')
        .select('*', { count: 'exact', head: true })
        .eq('grid_id', grid.id)

      let isLiked = false
      if (session && !isOwnProfile) {
        const { data: like } = await supabase
          .from('grid_likes')
          .select('id')
          .eq('grid_id', grid.id)
          .eq('user_id', session.user.id)
          .single()

        isLiked = !!like
      }

      return {
        ...grid,
        like_count: likeCount || 0,
        is_liked: isLiked,
      }
    })
  )

  // Fetch user's posts with context
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Enrich posts with parent page names
  const postsWithContext = await Promise.all(
    (posts || []).map(async (post) => {
      if (!post.parent_page_type || !post.parent_page_id) {
        return { ...post, parent_page_name: null }
      }

      let name = null
      const type = post.parent_page_type
      const id = post.parent_page_id

      if (type === 'driver') {
        const { data } = await supabase.from('drivers').select('name').eq('id', id).single()
        name = data?.name || null
      } else if (type === 'team') {
        const { data } = await supabase.from('teams').select('name').eq('id', id).single()
        name = data?.name || null
      } else if (type === 'track') {
        const { data } = await supabase.from('tracks').select('name').eq('id', id).single()
        name = data?.name || null
      } else if (type === 'profile') {
        const { data } = await supabase.from('profiles').select('username').eq('id', id).single()
        name = data?.username || null
      }

      return { ...post, parent_page_name: name }
    })
  )

  // Fetch discussion posts on this profile
  const { data: profilePosts } = await supabase
    .from('posts')
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
    .eq('parent_page_type', 'profile')
    .eq('parent_page_id', profile.id)
    .order('created_at', { ascending: false })

  // Check if current user follows this profile
  let isFollowing = false
  if (session && !isOwnProfile) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', session.user.id)
      .eq('following_id', profile.id)
      .single()

    isFollowing = !!follow
  }

  // Fetch follower and following counts
  const { count: followerCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="mb-8 overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.username}
                className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-300 shadow-lg">
                <span className="text-4xl font-bold text-gray-600">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="mt-4 flex-1 text-center md:mt-0 md:text-left">
              <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-white md:justify-start">
                <div className="flex items-center space-x-1">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">{profile.points} points</span>
                </div>
                <Link
                  href={`/u/${profile.username}/followers`}
                  className="hover:underline"
                >
                  <span className="font-semibold">{followerCount || 0}</span>
                  <span className="ml-1 text-sm opacity-90">followers</span>
                </Link>
                <Link
                  href={`/u/${profile.username}/following`}
                  className="hover:underline"
                >
                  <span className="font-semibold">{followingCount || 0}</span>
                  <span className="ml-1 text-sm opacity-90">following</span>
                </Link>
                {profile.city && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.city}</span>
                  </div>
                )}
                {profile.show_state_on_profile && profile.state && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.state}</span>
                  </div>
                )}
                {profile.country && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.country}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0">
              {isOwnProfile ? (
                <Link
                  href="/profile/edit"
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  <FollowButton targetUserId={profile.id} isInitiallyFollowing={isFollowing} />
                  <ReportButton targetId={profile.id} targetType="profile" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {profile.age && (
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="text-lg font-semibold text-gray-900">{profile.age}</p>
              </div>
            )}
            {profile.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-900">{profile.email}</p>
              </div>
            )}
          </div>

          {/* Social Links */}
          {profile.social_links && typeof profile.social_links === 'object' && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Social Links</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.social_links as Record<string, string>).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      {platform}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grids Section */}
      {gridsWithLikes && gridsWithLikes.length > 0 && (
        <UserGridsSection
          grids={gridsWithLikes}
          username={profile.username}
          isOwnProfile={isOwnProfile}
          currentUserId={session?.user.id}
        />
      )}

      {/* Posts Section */}
      {postsWithContext && postsWithContext.length > 0 && (
        <UserPostsSection posts={postsWithContext} username={profile.username} />
      )}

      {/* Discussion Section */}
      <ProfileDiscussionSection
        posts={profilePosts || []}
        profileId={profile.id}
        profileUsername={profile.username}
      />
    </div>
  )
}

