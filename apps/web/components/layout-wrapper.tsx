'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TopNav } from '@/components/navbar/top-nav'
import { BottomNavbar } from '@/components/navbar/bottom-navbar'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'
import { FullscreenHandler } from '@/components/fullscreen-handler'
import { createClientComponentClient } from '@/utils/supabase-client'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isComingSoon = pathname === '/coming-soon'
  const supabase = createClientComponentClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (isMounted) setIsAuthenticated(!!session)
    }

    loadSession()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setIsAuthenticated(!!session)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

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

  return (
    <>
      <FullscreenHandler autoRequest={true} />
      <TopNav />
      <main className={`min-h-screen ${isAuthenticated ? 'pb-20' : ''}`}>
        {children}
      </main>
      {showFooter ? <Footer /> : null}
      <LiveRaceBanner />
      {isAuthenticated && !isDesktop ? <BottomNavbar /> : null}
    </>
  )
}






