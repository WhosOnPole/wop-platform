'use client'

import { usePathname } from 'next/navigation'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { AuthLayoutShell } from '@/components/auth-layout-shell'

const AUTH_PATHS = ['/login', '/signup', '/auth/', '/auth/callback', '/auth/reset-password']

function isAuthPath(path: string | null) {
  if (!path) return false
  return AUTH_PATHS.some((p) => path === p || path.startsWith(p))
}

/**
 * For auth routes (/login, /signup, /auth/*): render minimal shell (no TopNav, Footer, etc.)
 * For other routes: render full LayoutWrapper with nav, footer, modals.
 */
export function LayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (isAuthPath(pathname)) {
    return <AuthLayoutShell>{children}</AuthLayoutShell>
  }
  return <LayoutWrapper>{children}</LayoutWrapper>
}
