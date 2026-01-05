import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReportsQueue } from '@/components/reports/reports-queue'

export default async function ReportsPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch pending reports with reporter info
  const { data: reports } = await supabase
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reporter_id (
        id,
        username
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const pending = reports || []

  // Collect target IDs by type to fetch previews
  const postIds = pending.filter((r) => r.target_type === 'post').map((r) => r.target_id)
  const commentIds = pending.filter((r) => r.target_type === 'comment').map((r) => r.target_id)
  const gridIds = pending.filter((r) => r.target_type === 'grid').map((r) => r.target_id)
  const profileIds = pending.filter((r) => r.target_type === 'profile').map((r) => r.target_id)

  const [postsRes, commentsRes, gridsRes, profilesRes] = await Promise.all([
    postIds.length
      ? supabase
          .from('posts')
          .select(
            `
            id,
            content,
            parent_page_type,
            parent_page_id,
            user:profiles!user_id (
              username
            )
          `
          )
          .in('id', postIds)
      : { data: [] },
    commentIds.length
      ? supabase
          .from('comments')
          .select(
            `
            id,
            content,
            post_id,
            user:profiles!user_id (
              username
            )
          `
          )
          .in('id', commentIds)
      : { data: [] },
    gridIds.length
      ? supabase
          .from('grids')
          .select(
            `
            id,
            blurb,
            user:profiles!user_id (
              username
            )
          `
          )
          .in('id', gridIds)
      : { data: [] },
    profileIds.length
      ? supabase
          .from('profiles')
          .select('id, username, profile_image_url')
          .in('id', profileIds)
      : { data: [] },
  ])

  const postMap = Object.fromEntries((postsRes.data || []).map((p) => [p.id, p]))
  const commentMap = Object.fromEntries((commentsRes.data || []).map((c) => [c.id, c]))
  const gridMap = Object.fromEntries((gridsRes.data || []).map((g) => [g.id, g]))
  const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p]))

  // Collect parent page IDs from posts/comments for naming
  const parentDriverIds = new Set<string>()
  const parentTeamIds = new Set<string>()
  const parentTrackIds = new Set<string>()
  const parentProfileIds = new Set<string>()

  Object.values(postMap).forEach((p: any) => {
    if (p.parent_page_type === 'driver' && p.parent_page_id) parentDriverIds.add(p.parent_page_id)
    if (p.parent_page_type === 'team' && p.parent_page_id) parentTeamIds.add(p.parent_page_id)
    if (p.parent_page_type === 'track' && p.parent_page_id) parentTrackIds.add(p.parent_page_id)
    if (p.parent_page_type === 'profile' && p.parent_page_id) parentProfileIds.add(p.parent_page_id)
  })

  const [parentDriversRes, parentTeamsRes, parentTracksRes, parentProfilesRes] = await Promise.all([
    parentDriverIds.size
      ? supabase
          .from('drivers')
          .select('id, name')
          .in('id', Array.from(parentDriverIds))
      : { data: [] },
    parentTeamIds.size
      ? supabase
          .from('teams')
          .select('id, name')
          .in('id', Array.from(parentTeamIds))
      : { data: [] },
    parentTrackIds.size
      ? supabase
          .from('tracks')
          .select('id, name')
          .in('id', Array.from(parentTrackIds))
      : { data: [] },
    parentProfileIds.size
      ? supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(parentProfileIds))
      : { data: [] },
  ])

  const driverNameMap = Object.fromEntries((parentDriversRes.data || []).map((d) => [d.id, d.name]))
  const teamNameMap = Object.fromEntries((parentTeamsRes.data || []).map((t) => [t.id, t.name]))
  const trackNameMap = Object.fromEntries((parentTracksRes.data || []).map((t) => [t.id, t.name]))
  const parentProfileNameMap = Object.fromEntries(
    (parentProfilesRes.data || []).map((p) => [p.id, p.username])
  )

  const enrichedReports =
    pending?.map((report) => {
      let targetPreview: any = null
      if (report.target_type === 'post') {
        const p = postMap[report.target_id]
        if (p)
          targetPreview = {
            type: 'post',
            content: p.content,
            username: p.user?.username,
            parent_page_type: p.parent_page_type,
            parent_page_id: p.parent_page_id,
            parent_name:
              p.parent_page_type === 'driver'
                ? driverNameMap[p.parent_page_id as string]
                : p.parent_page_type === 'team'
                ? teamNameMap[p.parent_page_id as string]
                : p.parent_page_type === 'track'
                ? trackNameMap[p.parent_page_id as string]
                : p.parent_page_type === 'profile'
                ? parentProfileNameMap[p.parent_page_id as string]
                : null,
          }
      } else if (report.target_type === 'comment') {
        const c = commentMap[report.target_id]
        if (c) {
          const parentPost = postMap[c.post_id]
          targetPreview = {
            type: 'comment',
            content: c.content,
            username: c.user?.username,
            parent_page_type: parentPost?.parent_page_type,
            parent_page_id: parentPost?.parent_page_id,
            parent_name:
              parentPost?.parent_page_type === 'driver'
                ? driverNameMap[parentPost.parent_page_id as string]
                : parentPost?.parent_page_type === 'team'
                ? teamNameMap[parentPost.parent_page_id as string]
                : parentPost?.parent_page_type === 'track'
                ? trackNameMap[parentPost.parent_page_id as string]
                : parentPost?.parent_page_type === 'profile'
                ? parentProfileNameMap[parentPost.parent_page_id as string]
                : null,
          }
        }
      } else if (report.target_type === 'grid') {
        const g = gridMap[report.target_id]
        if (g) targetPreview = { type: 'grid', content: g.blurb, username: g.user?.username }
      } else if (report.target_type === 'profile') {
        const p = profileMap[report.target_id]
        if (p) targetPreview = { type: 'profile', username: p.username, image: p.profile_image_url }
      }
      return { ...report, targetPreview }
    }) || []

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Reports Queue</h1>
      <p className="mb-8 text-gray-600">
        Review and resolve user reports. Removing content will deduct 5 points and add 1 strike to
        the content owner.
      </p>

      <ReportsQueue initialReports={enrichedReports} />
    </div>
  )
}

