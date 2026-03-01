import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type TargetType = 'post' | 'comment' | 'grid' | 'profile' | 'grid_slot_comment'

interface RemovePayload {
  reportId: number
  targetType: TargetType
  targetId: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SECRET_KEY) {
    return NextResponse.json(
      {
        error: 'Server configuration missing. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.',
      },
      { status: 500 }
    )
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
      // Delete votes first (polymorphic, no FK cascade)
      await supabase.from('votes').delete().eq('target_id', targetId).eq('target_type', 'post')
      const { error } = await supabase.from('posts').delete().eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'comment') {
      await supabase.from('votes').delete().eq('target_id', targetId).eq('target_type', 'comment')
      const { error } = await supabase.from('comments').delete().eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'grid_slot_comment') {
      // Delete votes for this slot comment (votes.target_type may be 'grid_slot_comment')
      await supabase.from('votes').delete().eq('target_id', targetId).eq('target_type', targetType as any)
      const { error } = await supabase
        .from('grid_slot_comments')
        .delete()
        .eq('id', targetId)
      if (error) throw error
    } else if (targetType === 'grid') {
      // Delete grid-dependent tables first (FK constraints)
      await supabase.from('grid_likes').delete().eq('grid_id', targetId)
      await supabase.from('grid_slot_comments').delete().eq('grid_id', targetId)
      await supabase.from('grid_slot_blurbs').delete().eq('grid_id', targetId)
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

