'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CreateModalProvider } from '@/components/providers/create-modal-provider'
import { TopNav } from '@/components/navbar/top-nav'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'
import { AddToHomeScreenPrompt } from '@/components/add-to-home-screen-prompt'
import { PullToRefreshFeed } from '@/components/feed/pull-to-refresh-feed'
import { FullscreenHandler } from '@/components/fullscreen-handler'
import { Logo } from '@/components/ui/logo'
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
  const [isAboveIpad, setIsAboveIpad] = useState(false)
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
        .select('username, date_of_birth')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
          if (isMounted) router.replace(isProfileComplete ? '/feed' : '/onboarding')
        })
    }
    return () => { isMounted = false }
  }, [session, pathname, router, supabase])

  useEffect(() => {
    // Redirect to landing on sign-out when on protected path (not on initial load)
    if (!session && !isLoading && !isAuthPath(pathname)) {
      const publicPaths = ['/', '/privacy', '/terms', '/coming-soon', '/banned']
      if (!publicPaths.includes(pathname ?? '')) {
        router.replace('/')
      }
    }
  }, [session, isLoading, pathname, router])

  useEffect(() => {
    const desktopMq = window.matchMedia('(min-width: 768px)')
    const aboveIpadMq = window.matchMedia('(min-width: 1025px)')
    const update = () => {
      setIsDesktop(desktopMq.matches)
      setIsAboveIpad(aboveIpadMq.matches)
    }
    update()
    desktopMq.addEventListener('change', update)
    aboveIpadMq.addEventListener('change', update)
    return () => {
      desktopMq.removeEventListener('change', update)
      aboveIpadMq.removeEventListener('change', update)
    }
  }, [])

  if (isComingSoon) {
    return <>{children}</>
  }

  if (isAuthenticated && isAboveIpad) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <Logo variant="white" href="/feed" className="mb-8 h-14 w-auto" />
        <p className="max-w-md text-lg text-white">
          Desktop version coming soon.
        </p>
        <p className="mt-2 max-w-md text-base text-white/80">
          Please join us on a smaller screen or resize your browser window.
        </p>
      </div>
    )
  }

  const showFooter = isDesktop || !isAuthenticated
  const isGridFullBleed =
    pathname?.startsWith('/grid/') || pathname?.startsWith('/profile/edit-grid/')
  const isHome = pathname === '/'
  const mainPadTop = !isGridFullBleed && !isHome ? 'pt-16' : ''
  const shouldConstrainContent = isAuthenticated && !isGridFullBleed
  const contentWrapperClass = shouldConstrainContent ? 'mx-auto w-full max-w-[430px]' : 'w-full'

  return (
    <CreateModalProvider>
      <FullscreenHandler autoRequest={true} />
      <TopNav />
      <main className={`min-h-screen ${mainPadTop}`}>
        {pathname === '/feed' ? (
          <PullToRefreshFeed onRefresh={() => router.refresh()} enabled={!isDesktop}>
            <div className={contentWrapperClass}>{children}</div>
          </PullToRefreshFeed>
        ) : (
          <div className={contentWrapperClass}>{children}</div>
        )}
      </main>
      {showFooter ? <Footer /> : null}
      <LiveRaceBanner />
      <AddToHomeScreenPrompt pathname={pathname} isAuthenticated={isAuthenticated} />
    </CreateModalProvider>
  )
}
