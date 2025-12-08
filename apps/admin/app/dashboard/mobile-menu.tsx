'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, Users, FileText, Flag, MessageSquare, Star, Calendar } from 'lucide-react'

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
  Users,
  FileText,
  Star,
  Flag,
  MessageSquare,
  Calendar,
}

export function MobileMenu({ navItems, userEmail }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Mobile menu sidebar */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-gray-800 px-6">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon] || Users
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Footer with user email and sign out */}
              <div className="border-t border-gray-800 p-4">
                <div className="mb-2 text-sm text-gray-400 truncate">
                  {userEmail}
                </div>
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
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

