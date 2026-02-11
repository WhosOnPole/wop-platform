'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TopNav } from '@/components/navbar/top-nav'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'
import { FullscreenHandler } from '@/components/fullscreen-handler'
import { createClientComponentClient, resetSessionInvalidated } from '@/utils/supabase-client'
import { clearSupabaseAuthStorage } from '@/utils/clear-auth-storage'

const AUTH_PATHS = ['/login', '/signup', '/auth/', '/auth/callback', '/auth/reset-password']

function isAuthPath(path: string | null) {
  if (!path) return false
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p))
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isComingSoon = pathname === '/coming-soon'
  const supabase = createClientComponentClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        const isInvalidRefresh =
          msg.includes('Refresh Token') ||
          msg.includes('refresh_token') ||
          (error as { status?: number }).status === 400 ||
          (error as { status?: number }).status === 429
        if (isInvalidRefresh) {
          clearSupabaseAuthStorage()
          if (isMounted && !isAuthPath(pathname)) router.replace('/login')
          if (isMounted) setIsAuthenticated(false)
          return
        }
      }

      if (isMounted) setIsAuthenticated(!!session)
    }

    if (!isAuthPath(pathname)) {
      loadSession()
    }

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) setIsAuthenticated(!!session)
      if (session) resetSessionInvalidated()
      if (session && (pathname === '/login' || pathname === '/signup')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, date_of_birth, age')
          .eq('id', session.user.id)
          .maybeSingle()
        const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth ?? profile?.age))
        if (isMounted) router.replace(isProfileComplete ? '/feed' : '/onboarding')
        return
      }
      if (event === 'SIGNED_OUT') {
        clearSupabaseAuthStorage()
        if (isMounted && !isAuthPath(pathname)) router.replace('/login')
      }
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase, pathname, router])

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
    <>
      <FullscreenHandler autoRequest={true} />
      <TopNav />
      <main className={`min-h-screen ${mainPadTop}`}>
        {children}
      </main>
      {showFooter ? <Footer /> : null}
      <LiveRaceBanner />
    </>
  )
}






