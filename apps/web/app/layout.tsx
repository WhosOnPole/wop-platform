import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LiveRaceBanner } from '@/components/live-race-banner'
import { QueryProvider } from '@/components/providers/query-provider'

export const metadata: Metadata = {
  title: "Who's on Pole? - F1 Fan Community",
  description: 'Join the ultimate Formula 1 fan community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <Navbar />
          <main className="min-h-screen bg-background">{children}</main>
          <Footer />
          <LiveRaceBanner />
        </QueryProvider>
      </body>
    </html>
  )
}
