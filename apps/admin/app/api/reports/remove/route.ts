import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
  if (!SUPABASE_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL is not set' }, { status: 500 })
  }

  // Prefer service role (bypasses RLS); fall back to session client (requires admin policies)
  let supabase: ReturnType<typeof createClient>
  if (SECRET_KEY) {
    supabase = createClient(SUPABASE_URL, SECRET_KEY)
  } else {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!anonKey) {
      return NextResponse.json(
        {
          error:
            'Set SUPABASE_SERVICE_ROLE_KEY for server-side delete, or ensure NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set for session-based admin delete.',
        },
        { status: 500 }
      )
    }
    const cookieStore = await cookies()
    supabase = createRouteHandlerClient(
      { cookies: () => cookieStore as any },
      { supabaseUrl: SUPABASE_URL, supabaseKey: anonKey }
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .single()
    const profile = profileData as { role?: string; email?: string } | null
    const isAdmin =
      profile?.role === 'admin' || profile?.email?.endsWith('@whosonpole.org')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = (supabase as any)
      .from('reports')
      .update({ status: 'resolved_removed' })
      .eq('id', reportId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    const message =
      error?.message ||
      error?.details ||
      (typeof error === 'object' ? JSON.stringify(error) : String(error)) ||
      'Failed to remove content'
    console.error('[reports/remove] Error:', message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

