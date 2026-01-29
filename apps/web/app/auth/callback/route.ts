import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient(
      { cookies: () => cookieStore as any },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    )
    // Check if this is a password recovery flow
    if (type === 'recovery') {
      // Exchange code for session (creates temporary session for password reset)
      await supabase.auth.exchangeCodeForSession(code)
      
      // Redirect to reset password page with the code
      const resetUrl = new URL('/auth/reset-password', requestUrl.origin)
      resetUrl.searchParams.set('code', code)
      return NextResponse.redirect(resetUrl)
    }

    // Regular OAuth/auth flow
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has completed onboarding (username + dob/age)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, date_of_birth, age')
        .eq('id', session.user.id)
        .maybeSingle()

      const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth || profile?.age))

      // If not complete, redirect to onboarding Step 1 (Profile)
      if (!isProfileComplete) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/feed', requestUrl.origin))
}

