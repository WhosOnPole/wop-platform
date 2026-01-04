import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { searchParams } = new URL(request.url)
  const showAll = searchParams.get('showAll') === 'true'
  const minStrikes = Number(searchParams.get('minStrikes') || '1')
  const maxPoints = Number(searchParams.get('maxPoints') || '0')

  try {
    let query = supabase
      .from('profiles')
      .select('id, username, email, points, strikes, banned_until, profile_image_url')
      .order('strikes', { ascending: false })
      .limit(200)

    if (!showAll) {
      query = query.or(`strikes.gte.${minStrikes},points.lte.${maxPoints}`)
    }

    const { data: profiles, error } = await query
    if (error) throw error

    // Count recent reports per user (last 90 days)
    const ownerIds = (profiles || []).map((p: any) => p.id)
    let reportsByOwner: Record<string, number> = {}
    if (ownerIds.length > 0) {
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('target_id, target_type')
        .gte('created_at', since)
        .or(`target_type.eq.profile,target_type.eq.post,target_type.eq.comment,target_type.eq.grid`)
      if (reportsError) throw reportsError

      // We need owner resolution for posts/comments/grids -> fetch ids owned by these users
      const postIds: string[] = []
      const commentIds: string[] = []
      const gridIds: string[] = []
      reports?.forEach((r) => {
        if (r.target_type === 'post') postIds.push(r.target_id)
        else if (r.target_type === 'comment') commentIds.push(r.target_id)
        else if (r.target_type === 'grid') gridIds.push(r.target_id)
        else if (r.target_type === 'profile') {
          reportsByOwner[r.target_id] = (reportsByOwner[r.target_id] || 0) + 1
        }
      })

      const [postOwners, commentOwners, gridOwners] = await Promise.all([
        postIds.length
          ? supabase.from('posts').select('id, user_id').in('id', postIds)
          : { data: [] },
        commentIds.length
          ? supabase.from('comments').select('id, user_id').in('id', commentIds)
          : { data: [] },
        gridIds.length
          ? supabase.from('grids').select('id, user_id').in('id', gridIds)
          : { data: [] },
      ])

      ;(postOwners.data || []).forEach((p: any) => {
        reportsByOwner[p.user_id] = (reportsByOwner[p.user_id] || 0) + 1
      })
      ;(commentOwners.data || []).forEach((c: any) => {
        reportsByOwner[c.user_id] = (reportsByOwner[c.user_id] || 0) + 1
      })
      ;(gridOwners.data || []).forEach((g: any) => {
        reportsByOwner[g.user_id] = (reportsByOwner[g.user_id] || 0) + 1
      })
    }

    const result = (profiles || []).map((p: any) => ({
      ...p,
      recent_reports: reportsByOwner[p.id] || 0,
    }))

    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load users' }, { status: 500 })
  }
}

