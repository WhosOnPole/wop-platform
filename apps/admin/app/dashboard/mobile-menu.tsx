'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Calendar,
  FileText,
  Flag,
  Gauge,
  LogOut,
  Menu,
  MessageSquare,
  PencilLine,
  Star,
  Trophy,
  Users,
  X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface MobileMenuProps {
  navItems: NavItem[]
  userEmail: string
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell,
  Calendar,
  FileText,
  Flag,
  Gauge,
  MessageSquare,
  PencilLine,
  Star,
  Trophy,
  Users,
}

export function MobileMenu({ navItems, userEmail }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-4 z-50 rounded-full bg-[#0F172A] p-2 text-white shadow-lg transition-colors hover:bg-slate-800 lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile menu sidebar */}
          <aside className="fixed left-0 top-0 z-50 h-full w-[260px] transform bg-[#0F172A] text-white transition-transform duration-300 ease-in-out lg:hidden">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#25B4B1]">
                    Who&apos;s on Pole?
                  </p>
                  <h1 className="mt-1 text-lg font-bold tracking-tight">Control Center</h1>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon] || Users
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex min-h-12 items-center space-x-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span
                        className={`absolute left-0 h-6 w-1 rounded-r-full ${
                          isActive ? 'bg-[#25B4B1]' : 'bg-transparent'
                        }`}
                      />
                      <Icon className={`h-5 w-5 ${isActive ? 'text-[#25B4B1]' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Footer with user email and sign out */}
              <div className="border-t border-white/10 p-4">
                <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Signed in
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-300">{userEmail}</p>
                </div>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  )
}

