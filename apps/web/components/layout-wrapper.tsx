'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Hide navbar/footer for home page (/) and coming-soon page
  const isComingSoon = pathname === '/coming-soon' || pathname === '/'

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






