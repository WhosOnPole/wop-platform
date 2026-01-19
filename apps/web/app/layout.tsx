import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { BotIDProviderWrapper } from '@/components/providers/botid-provider'
import { LayoutWrapper } from '@/components/layout-wrapper'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#111111',
}

export const metadata: Metadata = {
  title: "Who's on Pole? - F1 Fan Community",
  description: 'Join the ultimate Formula 1 fan community',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Who's on Pole?",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
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
          <BotIDProviderWrapper>
            <LayoutWrapper>{children}</LayoutWrapper>
          </BotIDProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  )
}
