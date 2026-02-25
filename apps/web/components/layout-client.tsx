'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CreateModalProvider } from '@/components/providers/create-modal-provider'
import { TopNav } from '@/components/navbar/top-nav'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'
import { FullscreenHandler } from '@/components/fullscreen-handler'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useAuthSession } from '@/components/providers/auth-session-provider'

const AUTH_PATHS = ['/login', '/signup', '/auth/', '/auth/callback', '/auth/reset-password']

function isAuthPath(path: string | null) {
  if (!path) return false
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p))
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const prevPathnameRef = useRef<string | null>(null)
  const isComingSoon = pathname === '/coming-soon'
  const { session, isLoading } = useAuthSession()
  const supabase = createClientComponentClient()
  const [isDesktop, setIsDesktop] = useState(false)
  const isAuthenticated = !!session

  // Scroll to top on route change so the nav gradient isn’t active (except in-feed interactions, which don’t change pathname)
  useEffect(() => {
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      window.scrollTo(0, 0)
    }
    prevPathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    let isMounted = true

    if (session && (pathname === '/login' || pathname === '/signup')) {
      supabase
        .from('profiles')
        .select('username, date_of_birth, age')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth ?? profile?.age))
          if (isMounted) router.replace(isProfileComplete ? '/feed' : '/onboarding')
        })
    }
    return () => { isMounted = false }
  }, [session, pathname, router, supabase])

  useEffect(() => {
    // Only redirect to login on sign-out, not on initial load (public pages allowed)
    if (!session && !isLoading && !isAuthPath(pathname)) {
      const publicPaths = ['/', '/privacy', '/terms', '/coming-soon', '/banned']
      if (!publicPaths.includes(pathname ?? '')) {
        router.replace('/login')
      }
    }
  }, [session, isLoading, pathname, router])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (isComingSoon) {
    return <>{children}</>
  }

  const showFooter = isDesktop || !isAuthenticated
  const isGridFullBleed =
    pathname?.startsWith('/grid/') || pathname?.startsWith('/profile/edit-grid/')
  const isHome = pathname === '/'
  const mainPadTop = !isGridFullBleed && !isHome ? 'pt-14' : ''

  return (
    <CreateModalProvider>
      <FullscreenHandler autoRequest={true} />
      <TopNav />
      <main className={`min-h-screen ${mainPadTop}`}>
        {children}
      </main>
      {showFooter ? <Footer /> : null}
      <LiveRaceBanner />
    </CreateModalProvider>
  )
}
