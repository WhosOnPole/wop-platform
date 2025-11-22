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
export const runtime = 'edge'

interface PageProps {
  params: {
    username: string
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = params
  const supabase = createServerComponentClient({ cookies })
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

  // Fetch user's grids
  const { data: grids } = await supabase
    .from('grids')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch user's posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

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
                {profile.city && profile.state && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {profile.city}, {profile.state}
                    </span>
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
      {grids && grids.length > 0 && (
        <UserGridsSection grids={grids} username={profile.username} />
      )}

      {/* Posts Section */}
      {posts && posts.length > 0 && (
        <UserPostsSection posts={posts} username={profile.username} />
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

