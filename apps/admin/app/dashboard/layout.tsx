import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Users, FileText, Flag, MessageSquare, Star, Calendar, Mail, Bell, Image, Trash2, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import { PasswordRecoveryCheck } from './password-recovery-check'
import { MobileMenu } from './mobile-menu'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient({ cookies })
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
    redirect('https://www.whosonpole.org')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'Users' },
    { href: '/dashboard/data-enrichment', label: 'Data Enrichment', icon: 'Users' },
    { href: '/dashboard/content', label: 'Content Creation', icon: 'FileText' },
    { href: '/dashboard/highlights', label: 'Weekly Highlights', icon: 'Star' },
    { href: '/dashboard/reports', label: 'Reports', icon: 'Flag' },
    { href: '/dashboard/track-tips', label: 'Track Tips', icon: 'MessageSquare' },
    { href: '/dashboard/chat-logs', label: 'Chat Logs', icon: 'Calendar' },
    { href: '/dashboard/users', label: 'Users (Points/Strikes)', icon: 'Users' },
  ]

  const workerNavItems = [
    { href: '/dashboard/emails', label: 'Email Queue', icon: Mail },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/images', label: 'Image Processing', icon: Image },
    { href: '/dashboard/cleanup', label: 'Data Cleanup', icon: Trash2 },
    { href: '/dashboard/leaderboards', label: 'Leaderboards', icon: Trophy },
  ]
  // Icon mapping for desktop sidebar (server component can use components directly)
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Users,
    FileText,
    Star,
    Flag,
    MessageSquare,
    Calendar,
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu */}
      <MobileMenu navItems={navItems} userEmail={session.user.email || ''} />

      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:block w-64 bg-gray-900 text-white">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-gray-800 px-6">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon] || Users
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
            <div className="my-4 border-t border-gray-800 pt-4">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Workers
              </p>
              {workerNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
          <div className="border-t border-gray-800 p-4">
            <div className="mb-2 text-sm text-gray-400">
              {session.user.email}
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        <PasswordRecoveryCheck />
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
