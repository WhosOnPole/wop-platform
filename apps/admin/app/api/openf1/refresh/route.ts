import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

const COOLDOWN_HOURS = 24

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SECRET_KEY,
      }
    )
    
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .single()

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'

    if (!isAdminEmail && !isAdminRole) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Check for recent refresh (24-hour cooldown)
    const { data: recentRefresh } = await supabase
      .from('openf1_refresh_log')
      .select('triggered_at')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .single()

    if (recentRefresh) {
      const lastRefreshTime = new Date(recentRefresh.triggered_at).getTime()
      const now = Date.now()
      const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60)

      if (hoursSinceRefresh < COOLDOWN_HOURS) {
        const hoursRemaining = COOLDOWN_HOURS - hoursSinceRefresh
        return NextResponse.json(
          {
            error: 'Cooldown active',
            message: `Please wait ${hoursRemaining.toFixed(1)} more hours before refreshing again.`,
            lastRefresh: recentRefresh.triggered_at,
            hoursRemaining: hoursRemaining,
          },
          { status: 429 }
        )
      }
    }

    // Get Supabase project details from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Extract project ref from URL
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    if (!projectRef) {
      return NextResponse.json(
        { error: 'Invalid Supabase URL' },
        { status: 500 }
      )
    }

    // Call the Edge Function
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ingest-openf1`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    })

    const responseData = await response.json().catch(() => ({}))
    
    // Log the refresh attempt
    const { error: logError } = await supabase
      .from('openf1_refresh_log')
      .insert({
        triggered_by: session.user.id,
        status: response.ok ? 'success' : 'error',
        error_message: response.ok ? null : (responseData.error || response.statusText),
      })

    if (logError) {
      console.error('Error logging refresh:', logError)
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'Refresh failed',
          message: responseData.error || response.statusText,
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OpenF1 data refresh initiated successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in OpenF1 refresh:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check last refresh time and cooldown status
export async function GET() {
  try {
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SECRET_KEY,
      }
    )
    
    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .single()

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'

    if (!isAdminEmail && !isAdminRole) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get last refresh
    const { data: lastRefresh } = await supabase
      .from('openf1_refresh_log')
      .select('triggered_at, status')
      .order('triggered_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastRefresh) {
      return NextResponse.json({
        lastRefresh: null,
        canRefresh: true,
        hoursRemaining: 0,
      })
    }

    const lastRefreshTime = new Date(lastRefresh.triggered_at).getTime()
    const now = Date.now()
    const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, COOLDOWN_HOURS - hoursSinceRefresh)
    const canRefresh = hoursRemaining === 0

    return NextResponse.json({
      lastRefresh: lastRefresh.triggered_at,
      status: lastRefresh.status,
      canRefresh,
      hoursRemaining: canRefresh ? 0 : hoursRemaining,
      hoursSinceRefresh,
    })
  } catch (error: any) {
    console.error('Error checking refresh status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

