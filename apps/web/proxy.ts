import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/onboarding',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/reset-password',
  '/banned',
  '/coming-soon',
  '/privacy',
  '/terms',
  '/api/auth/tiktok',
  '/api/auth/tiktok/callback',
  '/tiktokUltdht23ChFllaZO9MnLlgSt7HMHnZzl.txt',
]

/**
 * Proxy runs on every matched request. We must:
 * 1. Exclude /api from matcher so API routes don't each trigger getSession.
 * 2. Skip session logic entirely for _next/* (e.g. _next/data RSC payloads) so 500+ requests/min don't each hit /token.
 * 3. Create one Supabase client and call getSession() once per request when we do need auth.
 */
export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/_next/')) return res

  let supabase: ReturnType<typeof createMiddlewareClient> | null = null
  let session: Awaited<ReturnType<ReturnType<typeof createMiddlewareClient>['auth']['getSession']>>['data']['session'] | undefined = undefined

  async function getSessionOnce() {
    if (session !== undefined) return session
    if (!supabase) {
      supabase = createMiddlewareClient(
        { req: req as any, res: res as any },
        {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        }
      )
    }
    try {
      const { data } = await supabase.auth.getSession()
      session = data.session
    } catch (e) {
      console.error('Error checking session in proxy:', e)
    }
    return session
  }

  try {
    // Home: redirect authenticated users to feed/onboarding
    if (pathname === '/') {
      const sess = await getSessionOnce()
      if (sess) {
        try {
          if (!supabase) throw new Error('no client')
          const client = supabase as SupabaseClient
          const { data: profile } = await client
            .from('profiles')
            .select('username, date_of_birth, age')
            .eq('id', sess.user.id)
            .maybeSingle()
          const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth ?? profile?.age))
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = isProfileComplete ? '/feed' : '/onboarding'
          return NextResponse.redirect(redirectUrl)
        } catch (error) {
          console.error('Error checking session for home page:', error)
        }
      }
      return res
    }

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

    if (isPublic) {
      const sess = await getSessionOnce()
      if (sess && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
        try {
          if (!supabase) throw new Error('no client')
          const client = supabase as SupabaseClient
          const { data: profile } = await client
            .from('profiles')
            .select('username, date_of_birth, age')
            .eq('id', sess.user.id)
            .maybeSingle()
          const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth ?? profile?.age))
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = isProfileComplete ? '/feed' : '/onboarding'
          return NextResponse.redirect(redirectUrl)
        } catch (error) {
          console.error('Error fetching profile in proxy:', error)
        }
      }
      return res
    }

    // Protected routes: optional redirect for onboarding/banned
    const sess = await getSessionOnce()
    if (!sess) return res

    try {
      if (!supabase) throw new Error('no client')
      const client = supabase as SupabaseClient
      const { data: profile } = await client
        .from('profiles')
        .select('banned_until, username, date_of_birth, age')
        .eq('id', sess.user.id)
        .maybeSingle()

      if (profile?.banned_until) {
        const bannedUntil = new Date(profile.banned_until)
        if (bannedUntil > new Date()) {
          await client.auth.signOut()
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = '/banned'
          return NextResponse.redirect(redirectUrl)
        }
      }

      const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth ?? profile?.age))
      if (!isProfileComplete) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/onboarding'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error fetching profile in proxy:', error)
    }
  } catch (error) {
    console.error('Proxy error:', error)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Exclude /api, all of _next/*, favicon, and static assets so we only run session logic for real page navigations.
     * _next/data/* (RSC payloads) alone can be 500+ requests/min and each was calling getSession() → /token.
     */
    '/((?!api|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
