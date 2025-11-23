import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Who's on Pole? - Admin Dashboard",
  description: 'Admin dashboard for Who\'s on Pole? platform',
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

