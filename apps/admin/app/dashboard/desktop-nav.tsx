'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
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
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: string
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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

interface DesktopNavProps {
  navItems: NavItem[]
}

/**
 * Desktop sidebar navigation with active route highlighting.
 */
export function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
      {navItems.map((item) => {
        const Icon = ICON_MAP[item.icon] ?? Users
        const isActive =
          item.href === '/dashboard'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex min-h-12 items-center space-x-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span
              className={`absolute left-0 h-6 w-1 rounded-r-full transition-opacity ${
                isActive ? 'bg-[#25B4B1] opacity-100' : 'bg-transparent opacity-0'
              }`}
            />
            <Icon
              className={`h-5 w-5 transition-colors ${
                isActive ? 'text-[#25B4B1]' : 'text-slate-500 group-hover:text-[#25B4B1]'
              }`}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
