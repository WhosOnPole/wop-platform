import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SECRET_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SECRET_KEY)
  const { searchParams } = new URL(request.url)
  const showAll = searchParams.get('showAll') !== 'false'
  const minStrikes = Number(searchParams.get('minStrikes') || '1')
  const maxPoints = Number(searchParams.get('maxPoints') || '0')
  const search = (searchParams.get('search') || '').trim()
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '50')))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  try {
    let countQuery = supabase.from('profiles').select('id', { count: 'exact', head: true })
    let query = supabase
      .from('profiles')
      .select('id, username, email, points, strikes, banned_until, profile_image_url, created_at')
      .order(showAll ? 'username' : 'strikes', { ascending: showAll })
      .range(from, to)

    if (search) {
      const filter = `username.ilike.%${search}%,email.ilike.%${search}%`
      query = query.or(filter)
      countQuery = countQuery.or(filter)
    }

    if (!showAll) {
      const thresholdFilter = `strikes.gte.${minStrikes},points.lte.${maxPoints}`
      query = query.or(thresholdFilter)
      countQuery = countQuery.or(thresholdFilter)
    }

    const [{ data: profiles, error }, { count, error: countError }] = await Promise.all([
      query,
      countQuery,
    ])
    if (error) throw error
    if (countError) throw countError

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

    return NextResponse.json({
      data: result,
      total: count ?? result.length,
      page,
      pageSize,
      hasMore: count != null ? from + result.length < count : false,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load users' }, { status: 500 })
  }
}

