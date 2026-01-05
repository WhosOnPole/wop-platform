import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

type Action = 'ban' | 'unban' | 'reset_strikes' | 'adjust_points'

interface ActionPayload {
  action: Action
  userId: string
  deltaPoints?: number
  bannedUntil?: string | null
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  let payload: ActionPayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { action, userId, deltaPoints, bannedUntil } = payload || {}
  if (!action || !userId) {
    return NextResponse.json({ error: 'action and userId are required' }, { status: 400 })
  }

  try {
    if (action === 'ban') {
      const until =
        bannedUntil ||
        new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() // ~100 years
      const { error } = await supabase
        .from('profiles')
        .update({ banned_until: until })
        .eq('id', userId)
      if (error) throw error
    } else if (action === 'unban') {
      const { error } = await supabase.from('profiles').update({ banned_until: null }).eq('id', userId)
      if (error) throw error
    } else if (action === 'reset_strikes') {
      const { error } = await supabase.from('profiles').update({ strikes: 0 }).eq('id', userId)
      if (error) throw error
    } else if (action === 'adjust_points') {
      const delta = Number(deltaPoints || 0)
      const { error } = await supabase.rpc('award_points', { target_user_id: userId, delta_points: delta })
      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, points, strikes, banned_until')
      .eq('id', userId)
      .single()
    if (fetchError) throw fetchError

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Action failed' }, { status: 500 })
  }
}

