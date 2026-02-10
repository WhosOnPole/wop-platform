import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Redirect authenticated users from home to feed/onboarding
  if (pathname === '/') {
    try {
      const supabase = createMiddlewareClient(
        {
          req: req as any,
          res: res as any,
        },
        {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        }
      )

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
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = isProfileComplete ? '/feed' : '/onboarding'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking session for home page:', error)
    }

    return res
  }

  try {
    const supabase = createMiddlewareClient(
      {
        req: req as any,
        res: res as any,
      },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      }
    )

    // Allow access to onboarding, auth, and public routes (for unauthenticated users)
    const publicPaths = [
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
      '/tiktokUltdht23ChFllaZO9MnLlgSt7HMHnZzl.txt', // TikTok domain verification file
    ]
    if (publicPaths.some((path) => pathname.startsWith(path))) {
      // Still check session for authenticated users on public paths
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // If authenticated, redirect based on path
        if (session) {
          try {
                const { data: profile } = await supabase
              .from('profiles')
                  .select('username, date_of_birth, age')
              .eq('id', session.user.id)
              .maybeSingle()

                const isProfileComplete = Boolean(
                  profile?.username && (profile?.date_of_birth || profile?.age)
                )

            // If on login/signup, redirect to feed or onboarding
            if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
              const redirectUrl = req.nextUrl.clone()
                  redirectUrl.pathname = isProfileComplete ? '/feed' : '/onboarding'
              return NextResponse.redirect(redirectUrl)
            }
          } catch (error) {
            // If profile query fails, continue without redirect
            console.error('Error fetching profile in middleware:', error)
          }
        }
      } catch (error) {
        // If session check fails, continue without redirect
        console.error('Error checking session in middleware:', error)
      }

      return res
    }

    // For protected routes, check authentication and onboarding
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Not authenticated, allow through (they'll be redirected by page-level checks)
        return res
      }

      // Check ban status
      try {
          const { data: profile } = await supabase
          .from('profiles')
            .select('banned_until, username, date_of_birth, age')
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
          // Profile is considered complete when it has a username AND dob/age.
          const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth || profile?.age))
          if (!isProfileComplete) {
          const redirectUrl = req.nextUrl.clone()
          redirectUrl.pathname = '/onboarding'
          return NextResponse.redirect(redirectUrl)
        }
      } catch (error) {
        // If profile query fails, allow through (page will handle auth)
        console.error('Error fetching profile in middleware:', error)
      }
    } catch (error) {
      // If session check fails, allow through (page will handle auth)
      console.error('Error checking session in middleware:', error)
    }
  } catch (error) {
    // If middleware completely fails, allow request through
    // Better to show the page with potential auth issues than a 500 error
    console.error('Middleware error:', error)
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
