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

