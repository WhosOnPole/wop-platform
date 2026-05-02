import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'

    if (!isAdminEmail && !isAdminRole) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { trackId, enabled } = body

    if (!trackId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Track ID and enabled status are required' },
        { status: 400 }
      )
    }

    const { data: track, error: updateError } = await supabase
      .from('tracks')
      .update({ chat_enabled: enabled })
      .eq('id', trackId)
      .select('id, chat_enabled')
      .single()

    if (updateError || !track) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update chat status' },
        { status: 500 }
      )
    }

    // Keep active chat rooms in sync with track chat toggle.
    await supabase
      .from('chat_rooms')
      .update({ mode: enabled ? 'open' : 'closed' })
      .eq('track_id', trackId)
      .gte('closes_at', new Date().toISOString())

    return NextResponse.json({
      success: true,
      enabled: track.chat_enabled,
    })
  } catch (error) {
    console.error('Error in admin chat toggle route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
