'use client'

import { Bell, HelpCircle, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const SECTION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  'data-enrichment': 'Data Management',
  content: 'Content Studio',
  highlights: 'Weekly Highlights',
  reports: 'Moderation',
  'track-tips': 'Track Tips',
  'chat-logs': 'Chat Logs',
  users: 'User Control',
  notifications: 'Notifications',
  leaderboards: 'Leaderboards',
}

/**
 * Minimal command bar for admin pages with breadcrumbs and global search affordance.
 */
export function TopBar() {
  const pathname = usePathname()
  const section = pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const label = SECTION_LABELS[section] ?? 'Dashboard'

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
          Admin Control Center
        </p>
        <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-500">
          <span>Home</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{label}</span>
        </div>
      </div>

      <div className="hidden flex-1 justify-end px-8 pr-2 md:flex">
        <label className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search records, queues, users..."
            className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#25B4B1] focus:bg-white focus:ring-4 focus:ring-[#25B4B1]/10"
          />
        </label>
      </div>
    </header>
  )
}
