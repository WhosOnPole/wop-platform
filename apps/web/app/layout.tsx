import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { BotIDProviderWrapper } from '@/components/providers/botid-provider'
import { AuthSessionProvider } from '@/components/providers/auth-session-provider'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { LoadingScreen } from '@/components/loading-screen'

const inter = localFont({
  src: '../public/fonts/Inter.ttf',
  display: 'swap',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
})
const raygun = localFont({
  src: '../public/fonts/RaygunRegular.ttf',
  display: 'swap',
  weight: '400',
  style: 'normal',
  variable: '--font-raygun',
})
const sageva = localFont({
  src: '../public/fonts/Sageva.ttf',
  display: 'swap',
  weight: '400',
  style: 'normal',
  variable: '--font-sageva',
})

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
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${raygun.variable} ${sageva.variable}`}
      >
        <QueryProvider>
          <BotIDProviderWrapper>
            <AuthSessionProvider>
              <LoadingScreen />
              <LayoutWrapper>{children}</LayoutWrapper>
            </AuthSessionProvider>
          </BotIDProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  )
}
