'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isComingSoon = pathname === '/coming-soon'

  if (isComingSoon) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">{children}</main>
      <Footer />
      <LiveRaceBanner />
    </>
  )
}

