import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check ban status if user has session
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_until')
      .eq('id', session.user.id)
      .single()

    // Check if user is banned
    if (profile?.banned_until) {
      const bannedUntil = new Date(profile.banned_until)
      if (bannedUntil > new Date()) {
        // User is banned, clear session and redirect
        await supabase.auth.signOut()
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/banned'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

