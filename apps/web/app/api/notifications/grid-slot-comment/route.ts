import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type RequestBody = {
  gridId?: string
  rankIndex?: number
  commentId?: string
  preview?: string
  parentCommentId?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const authClient = createServerComponentClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )

    const {
      data: { session },
    } = await authClient.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as RequestBody
    const gridId = body.gridId
    const commentId = body.commentId
    const rankIndex = body.rankIndex
    const preview = (body.preview || '').trim()
    const parentCommentId = body.parentCommentId ?? null

    if (!gridId || !commentId || typeof rankIndex !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 })
    }

    const adminClient = createServerComponentClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: serviceKey,
      }
    )

    // Verify actor owns the comment being notified about.
    const { data: commentRow } = await adminClient
      .from('grid_slot_comments')
      .select('id, user_id, grid_id, rank_index')
      .eq('id', commentId)
      .maybeSingle()

    if (
      !commentRow ||
      commentRow.user_id !== session.user.id ||
      commentRow.grid_id !== gridId ||
      commentRow.rank_index !== rankIndex
    ) {
      return NextResponse.json({ error: 'Invalid comment context' }, { status: 400 })
    }

    const { data: gridRow } = await adminClient
      .from('grids')
      .select('id, user_id, type')
      .eq('id', gridId)
      .maybeSingle()

    if (!gridRow?.user_id) {
      return NextResponse.json({ ok: true, inserted: 0 })
    }

    const recipientIds = new Set<string>()
    if (gridRow.user_id !== session.user.id) {
      recipientIds.add(gridRow.user_id)
    }

    if (parentCommentId) {
      const { data: parentCommentRow } = await adminClient
        .from('grid_slot_comments')
        .select('user_id')
        .eq('id', parentCommentId)
        .maybeSingle()
      if (parentCommentRow?.user_id && parentCommentRow.user_id !== session.user.id) {
        recipientIds.add(parentCommentRow.user_id)
      }
    }

    if (recipientIds.size === 0) {
      return NextResponse.json({ ok: true, inserted: 0 })
    }

    const rows = Array.from(recipientIds).map((userId) => ({
      user_id: userId,
      type: 'comment',
      actor_id: session.user.id,
      target_type: 'grid_slot_comment',
      target_id: commentId,
      metadata: {
        grid_id: gridId,
        grid_type: gridRow.type,
        rank_index: rankIndex,
        preview,
        parent_comment_id: parentCommentId,
      },
    }))

    const { error: insertError } = await adminClient.from('notifications').insert(rows)

    // Backward-compatible fallback for older enums that lack grid_slot_comment.
    if (insertError) {
      const fallbackRows = Array.from(recipientIds).map((userId) => ({
        user_id: userId,
        type: 'comment',
        actor_id: session.user.id,
        target_type: 'grid',
        target_id: gridId,
        metadata: {
          grid_id: gridId,
          grid_type: gridRow.type,
          rank_index: rankIndex,
          preview,
          slot_comment_id: commentId,
          parent_comment_id: parentCommentId,
        },
      }))
      const { error: fallbackError } = await adminClient.from('notifications').insert(fallbackRows)
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, inserted: recipientIds.size })
  } catch (error) {
    console.error('Error creating grid-slot comment notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
