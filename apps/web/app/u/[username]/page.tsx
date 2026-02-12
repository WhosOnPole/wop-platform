import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ProfileHeroSectionWrapper } from '@/components/profile/profile-hero-section-wrapper'
import { ProfilePageClient } from '@/components/profile/profile-page-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

type TabKey = 'activity' | 'drivers' | 'tracks' | 'teams'

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Check if current user follows this profile
  let isFollowing = false
  if (session && !isOwnProfile) {
    const { data: follow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', session.user.id)
      .eq('following_id', profile.id)
      .maybeSingle()

    isFollowing = !!follow
  }

  // Follower and following counts for activity tab
  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  // Fetch user's #1 team pick for background
  const { data: backgroundTeamGrid } = await supabase
    .from('grids')
    .select('ranked_items')
    .eq('user_id', profile.id)
    .eq('type', 'team')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let teamBackground: string | null = null
  if (backgroundTeamGrid && Array.isArray(backgroundTeamGrid.ranked_items) && backgroundTeamGrid.ranked_items.length > 0) {
    teamBackground = backgroundTeamGrid.ranked_items[0].name || null
  }

  // Fetch user's grids with like counts and history
  const { data: grids } = await supabase
    .from('grids')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  // Fetch like counts, comment counts, and user's like status for each grid
  const gridsWithLikes = await Promise.all(
    (grids || []).map(async (grid) => {
      const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
        supabase
          .from('grid_likes')
          .select('*', { count: 'exact', head: true })
          .eq('grid_id', grid.id),
        supabase
          .from('grid_slot_comments')
          .select('*', { count: 'exact', head: true })
          .eq('grid_id', grid.id),
      ])

      let isLiked = false
      if (session && !isOwnProfile) {
        const { data: like } = await supabase
          .from('grid_likes')
          .select('id')
          .eq('grid_id', grid.id)
          .eq('user_id', session.user.id)
          .maybeSingle()

        isLiked = !!like
      }

      return {
        ...grid,
        like_count: likeCount || 0,
        comment_count: commentCount ?? 0,
        is_liked: isLiked,
      }
    })
  )

  // Fetch activity: posts, comments, check-ins, likes, grid updates
  const activities: any[] = []

  // Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (posts) {
    for (const post of posts) {
      // Fetch target name based on type
      let targetName = null
      if (post.parent_page_type === 'driver' && post.parent_page_id) {
        const { data } = await supabase.from('drivers').select('name').eq('id', post.parent_page_id).single()
        targetName = data?.name
      } else if (post.parent_page_type === 'team' && post.parent_page_id) {
        const { data } = await supabase.from('teams').select('name').eq('id', post.parent_page_id).single()
        targetName = data?.name
      } else if (post.parent_page_type === 'track' && post.parent_page_id) {
        const { data } = await supabase.from('tracks').select('name').eq('id', post.parent_page_id).single()
        targetName = data?.name
      } else if (post.parent_page_type === 'profile' && post.parent_page_id) {
        const { data } = await supabase.from('profiles').select('username').eq('id', post.parent_page_id).single()
        targetName = data?.username
      }

      activities.push({
        id: post.id,
        type: 'post',
        content: post.content,
        created_at: post.created_at,
        target_id: post.parent_page_id,
        target_type: post.parent_page_type,
        target_name: targetName,
        post_id: post.id,
      })
    }
  }

  // Comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, post:posts!post_id(id, parent_page_type, parent_page_id)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (comments) {
    for (const comment of comments) {
      const post = comment.post as any
      const parentPageType = post?.parent_page_type
      const parentPageId = post?.parent_page_id

      // Fetch target name based on type
      let targetName = null
      if (parentPageType === 'driver' && parentPageId) {
        const { data } = await supabase.from('drivers').select('name').eq('id', parentPageId).single()
        targetName = data?.name
      } else if (parentPageType === 'team' && parentPageId) {
        const { data } = await supabase.from('teams').select('name').eq('id', parentPageId).single()
        targetName = data?.name
      } else if (parentPageType === 'track' && parentPageId) {
        const { data } = await supabase.from('tracks').select('name').eq('id', parentPageId).single()
        targetName = data?.name
      } else if (parentPageType === 'profile' && parentPageId) {
        const { data } = await supabase.from('profiles').select('username').eq('id', parentPageId).single()
        targetName = data?.username
      }

      const parentPost = comment.post as { id?: string } | null
      activities.push({
        id: comment.id,
        type: 'comment',
        content: comment.content,
        created_at: comment.created_at,
        target_id: parentPageId,
        target_type: parentPageType,
        target_name: targetName,
        post_id: parentPost?.id ?? undefined,
      })
    }
  }

  // Check-ins
  // TODO: Implement check-in system to track user check-ins on race starts (not race day start, the race's general start) on track pages when button is enabled
  // For now, this is a placeholder - will fetch from race_checkins table when implemented

  // Likes (votes)
  const { data: likes } = await supabase
    .from('votes')
    .select('*, target_type, target_id')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  if (likes) {
    for (const like of likes) {
      // Fetch target name based on type
      let targetName = null
      if (like.target_type === 'driver') {
        const { data } = await supabase.from('drivers').select('name').eq('id', like.target_id).single()
        targetName = data?.name
      } else if (like.target_type === 'team') {
        const { data } = await supabase.from('teams').select('name').eq('id', like.target_id).single()
        targetName = data?.name
      } else if (like.target_type === 'track') {
        const { data } = await supabase.from('tracks').select('name').eq('id', like.target_id).single()
        targetName = data?.name
      }

      activities.push({
        id: like.id,
        type: 'like',
        created_at: like.created_at,
        target_id: like.target_id,
        target_type: like.target_type,
        target_name: targetName,
      })
    }
  }

  // Grid updates (from posts with parent_page_type='profile' and parent_page_id=user_id)
  const { data: gridUpdatePosts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .eq('parent_page_type', 'profile')
    .eq('parent_page_id', profile.id)
    .order('created_at', { ascending: false })

  if (gridUpdatePosts) {
    for (const post of gridUpdatePosts) {
      // Try to determine grid type from post content
      let gridType: 'driver' | 'team' | 'track' | null = null
      if (post.content?.toLowerCase().includes('driver')) gridType = 'driver'
      else if (post.content?.toLowerCase().includes('team')) gridType = 'team'
      else if (post.content?.toLowerCase().includes('track')) gridType = 'track'

      activities.push({
        id: post.id,
        type: 'grid_update',
        content: post.content,
        created_at: post.created_at,
        target_type: gridType,
      })
    }
  }

  // Sort activities by created_at descending
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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

  // Enrich grid items with image data
  const enrichedGrids = await Promise.all(
    gridsWithLikes.map(async (grid) => {
      if (!Array.isArray(grid.ranked_items)) return grid

      const enrichedItems = await Promise.all(
        grid.ranked_items.map(async (item: { id: string; name: string }) => {
          if (grid.type === 'driver') {
            const { data: driver } = await supabase
              .from('drivers')
              .select('id, name, headshot_url, image_url')
              .eq('id', item.id)
              .maybeSingle()
            return {
              ...item,
              headshot_url: driver?.headshot_url || null,
              image_url: driver?.headshot_url || driver?.image_url || null,
            }
          } else if (grid.type === 'track') {
            const { data: track } = await supabase
              .from('tracks')
              .select('id, name, image_url, location, country, circuit_ref')
              .eq('id', item.id)
              .maybeSingle()
            return {
              ...item,
              image_url: track?.image_url || null,
              location: track?.location || null,
              country: track?.country || null,
              circuit_ref: track?.circuit_ref || null,
            }
          } else if (grid.type === 'team') {
            // Teams already have name, and we'll use getTeamIconUrl in the component
            return item
          }
          return item
        })
      )

      return {
        ...grid,
        ranked_items: enrichedItems,
      }
    })
  )

  // Separate grids by type
  const driverGrid = enrichedGrids.find((g) => g.type === 'driver')
  const trackGrid = enrichedGrids.find((g) => g.type === 'track')
  const teamGrid = enrichedGrids.find((g) => g.type === 'team')

  return (
    <div className="min-h-screen bg-black -mt-14">
      {/* Hero Section - in flow, 60vh height */}
      <div className="relative w-full h-[40vh] z-0">
        <ProfileHeroSectionWrapper
          profile={profile}
          isOwnProfile={isOwnProfile}
          teamBackground={teamBackground}
          supabaseUrl={supabaseUrl ?? undefined}
          isFollowing={isFollowing}
          currentUserId={session?.user.id || null}
        />
      </div>

      {/* Client component for tabs and content */}
      <ProfilePageClient
        profile={profile}
        isOwnProfile={isOwnProfile}
        teamBackground={teamBackground}
        driverGrid={driverGrid}
        trackGrid={trackGrid}
        teamGrid={teamGrid}
        activities={activities}
        profilePosts={profilePosts || []}
        followerCount={followerCount ?? 0}
        followingCount={followingCount ?? 0}
        supabaseUrl={supabaseUrl}
      />
    </div>
  )
}
