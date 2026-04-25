import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { PasswordRecoveryCheck } from './password-recovery-check'
import { MobileMenu } from './mobile-menu'
import { DesktopNav } from './desktop-nav'
import { TopBar } from './top-bar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', session.user.id)
    .single()

  const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
  const isAdminRole = profile?.role === 'admin'

  if (!isAdminEmail && !isAdminRole) {
    const headersList = await headers()
    const host = headersList.get('host') || ''
    const mainSiteUrl =
      process.env.NEXT_PUBLIC_MAIN_SITE_URL ||
      (host.startsWith('localhost') ? 'http://localhost:3000' : 'https://www.whosonpole.org')
    redirect(mainSiteUrl)
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'Gauge' },
    { href: '/dashboard/reports', label: 'Moderation', icon: 'Flag' },
    { href: '/dashboard/data-enrichment', label: 'Data Management', icon: 'PencilLine' },
    { href: '/dashboard/users', label: 'User Control', icon: 'Users' },
    { href: '/dashboard/content', label: 'Content Studio', icon: 'FileText' },
    { href: '/dashboard/highlights', label: 'Weekly Highlights', icon: 'Star' },
    { href: '/dashboard/track-tips', label: 'Track Tips', icon: 'MessageSquare' },
    { href: '/dashboard/chat-logs', label: 'Chat Logs', icon: 'Calendar' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: 'Bell' },
    { href: '/dashboard/leaderboards', label: 'Leaderboards', icon: 'Trophy' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-gray-900">
      {/* Mobile Menu */}
      <MobileMenu navItems={navItems} userEmail={session.user.email || ''} />

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden w-[260px] shrink-0 bg-[#0F172A] text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#25B4B1]">
                Who&apos;s on Pole?
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Control Center</h1>
            </div>
          </div>
          <DesktopNav navItems={navItems} />
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Signed in
              </p>
              <p className="mt-1 truncate text-sm text-gray-300">{session.user.email}</p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">
        <PasswordRecoveryCheck />
        <TopBar />
        <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
