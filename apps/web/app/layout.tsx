import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { BotIDProviderWrapper } from '@/components/providers/botid-provider'
import { LayoutWrapper } from '@/components/layout-wrapper'

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
          <BotIDProviderWrapper>
            <LayoutWrapper>{children}</LayoutWrapper>
          </BotIDProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  )
}
