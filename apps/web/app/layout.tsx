import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

