import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  try {
    const supabase = createMiddlewareClient({
      req: req as any,
      res: res as any,
    })

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Allow list for unauthenticated traffic (coming soon + auth callbacks + health)
    const publicPaths = ['/coming-soon', '/auth/callback', '/api/health']
    const isPublic = publicPaths.some((path) => pathname.startsWith(path))

    if (!session && !isPublic) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/coming-soon'
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }

    // For authenticated users, keep existing behavior:
    if (session) {
      // Example: block banned users
      const { data: profile } = await supabase
        .from('profiles')
        .select('banned_until, username')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile?.banned_until) {
        const bannedUntil = new Date(profile.banned_until)
        if (bannedUntil > new Date()) {
          await supabase.auth.signOut()
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = '/banned'
          redirectUrl.search = ''
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  } catch (error) {
    console.error('Proxy middleware error:', error)
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
