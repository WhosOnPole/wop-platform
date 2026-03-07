import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { BotIDProviderWrapper } from '@/components/providers/botid-provider'
import { AuthSessionProvider } from '@/components/providers/auth-session-provider'
import { LayoutSwitch } from '@/components/layout-switch'
import { LoadingScreen } from '@/components/loading-screen'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
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
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: "Who's on Pole? - F1 Fan Community",
  description: 'Join the ultimate F1 fan community',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
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
              <LayoutSwitch>{children}</LayoutSwitch>
            </AuthSessionProvider>
          </BotIDProviderWrapper>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
