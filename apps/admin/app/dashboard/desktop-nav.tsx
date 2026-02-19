'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileText, Flag, MessageSquare, Star, Calendar } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: string
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  FileText,
  Star,
  Flag,
  MessageSquare,
  Calendar,
}

interface DesktopNavProps {
  navItems: NavItem[]
}

/**
 * Desktop sidebar navigation with active route highlighting.
 */
export function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const Icon = ICON_MAP[item.icon] ?? Users
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
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
  )
}
