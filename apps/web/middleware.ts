import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  // Allow access to onboarding, auth, and public routes (for unauthenticated users)
  const publicPaths = ['/onboarding', '/login', '/signup', '/auth/callback', '/auth/reset-password', '/banned', '/', '/coming-soon']
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    // Still check session for authenticated users on public paths
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If authenticated, redirect based on path
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()

      // If on login/signup or home page, redirect to feed or onboarding
      if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = profile?.username ? '/feed' : '/coming-soon'
        return NextResponse.redirect(redirectUrl)
      }
    }

    return res
  }

  // For protected routes, check authentication and onboarding
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Not authenticated, allow through (they'll be redirected by page-level checks)
    return res
  }

  // Check ban status
    const { data: profile } = await supabase
      .from('profiles')
    .select('banned_until, username')
      .eq('id', session.user.id)
    .maybeSingle()

    // Check if user is banned
    if (profile?.banned_until) {
      const bannedUntil = new Date(profile.banned_until)
      if (bannedUntil > new Date()) {
        await supabase.auth.signOut()
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/banned'
        return NextResponse.redirect(redirectUrl)
      }
    }

  // Check if user needs to complete onboarding
  // Profile must have username to be considered complete
  if (!profile?.username) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/coming-soon'
    return NextResponse.redirect(redirectUrl)
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

