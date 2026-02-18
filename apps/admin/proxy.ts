import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  // Allow access to auth routes (callback, reset-password) and login/signup pages for unauthenticated users
  const publicPaths = ['/login', '/signup', '/auth/callback', '/auth/reset-password']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and not on public path, redirect to login
  if (!session && !isPublicPath) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if user is trying to access login/signup pages
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // If user has session, check admin access
  if (session && !isAuthPage) {
    // Check if user is admin and check ban status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, banned_until')
      .eq('id', session.user.id)
      .single()

    // Check ban status from profiles table
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

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'

    if (!isAdminEmail && !isAdminRole) {
      // Not an admin, redirect to main site
      const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
        (req.nextUrl.hostname === 'localhost' ? 'http://localhost:3000' : 'https://www.whosonpole.org')
      return NextResponse.redirect(new URL(mainSiteUrl))
    }
  }

  // If on login/signup pages and already authenticated
  if (session && isAuthPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', session.user.id)
      .maybeSingle()

    const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
    const isAdminRole = profile?.role === 'admin'

    if (isAdminEmail || isAdminRole) {
      // Admin user, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      // Non-admin user on login page, redirect to main site
      const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
        (req.nextUrl.hostname === 'localhost' ? 'http://localhost:3000' : 'https://www.whosonpole.org')
      return NextResponse.redirect(new URL(mainSiteUrl))
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

