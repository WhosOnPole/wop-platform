import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient(
      { cookies: () => cookies() },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )
    
    // Check if this is explicitly a password recovery flow FIRST, before exchanging
    if (type === 'recovery') {
      // Exchange code for session (creates temporary session for password reset)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        // If exchange fails, redirect to login with error
        const loginUrl = new URL('/login', requestUrl.origin)
        loginUrl.searchParams.set('error', 'invalid_token')
        return NextResponse.redirect(loginUrl)
      }
      
      // Redirect to reset password page (session already created, no need to pass code)
      const resetUrl = new URL('/auth/reset-password', requestUrl.origin)
      return NextResponse.redirect(resetUrl)
    }

    // Exchange code for session (for regular OAuth/auth flow)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      // If exchange fails, redirect to login with error
      const loginUrl = new URL('/login', requestUrl.origin)
      loginUrl.searchParams.set('error', 'invalid_token')
      return NextResponse.redirect(loginUrl)
    }

    // For regular OAuth/auth flow, check if user is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', session.user.id)
        .maybeSingle()

      const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
      const isAdminRole = profile?.role === 'admin'

      // If admin, redirect to dashboard
      if (isAdminEmail || isAdminRole) {
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
      }

      // If not admin, redirect to login (this is a regular user trying to access admin)
      return NextResponse.redirect(new URL('/login', requestUrl.origin))
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}

