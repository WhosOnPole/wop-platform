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
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  try {
    // Fetch content owned by user
    const [{ data: posts }, { data: comments }, { data: grids }] = await Promise.all([
      supabase.from('posts').select('id').eq('user_id', userId),
      supabase.from('comments').select('id').eq('user_id', userId),
      supabase.from('grids').select('id').eq('user_id', userId),
    ])

    const postIds = posts?.map((p) => p.id) || []
    const commentIds = comments?.map((c) => c.id) || []
    const gridIds = grids?.map((g) => g.id) || []

    const conditions = [
      `and(target_type.eq.profile,target_id.eq.${userId})`,
      postIds.length ? `and(target_type.eq.post,target_id.in.(${postIds.join(',')}))` : null,
      commentIds.length ? `and(target_type.eq.comment,target_id.in.(${commentIds.join(',')}))` : null,
      gridIds.length ? `and(target_type.eq.grid,target_id.in.(${gridIds.join(',')}))` : null,
    ].filter(Boolean)

    if (conditions.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const orFilter = conditions.join(',')
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, target_id, target_type, reason, status, created_at')
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data: reports || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch reports' }, { status: 500 })
  }
}

