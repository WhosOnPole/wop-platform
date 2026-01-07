import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type TargetType = 'post' | 'comment' | 'grid' | 'profile'

interface RemovePayload {
  reportId: number
  targetType: TargetType
  targetId: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SECRET_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SECRET_KEY)

  let payload: RemovePayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { reportId, targetId, targetType } = payload || {}
  if (!reportId || !targetId || !targetType) {
    return NextResponse.json({ error: 'reportId, targetId, targetType are required' }, { status: 400 })
  }

  try {
    if (targetType === 'post') {
      const { error } = await supabase.from('posts').delete().eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'comment') {
      const { error } = await supabase.from('comments').delete().eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'grid') {
      const { error } = await supabase.from('grids').delete().eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'profile') {
      // For profiles, do not delete the profile; mark as resolved only.
    } else {
      return NextResponse.json({ error: 'Unsupported target type' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: 'resolved_removed' })
      .eq('id', reportId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to remove content' }, { status: 500 })
  }
}

