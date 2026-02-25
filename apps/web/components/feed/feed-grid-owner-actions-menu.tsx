'use client'

import { useState, useRef, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { MoreVertical, Trash2 } from 'lucide-react'

interface FeedGridOwnerActionsMenuProps {
  gridUserId: string
  gridType: 'driver' | 'team' | 'track'
}

const TYPE_LABELS: Record<string, string> = {
  driver: 'Drivers',
  team: 'Teams',
  track: 'Tracks',
}

export function FeedGridOwnerActionsMenu({ gridUserId, gridType }: FeedGridOwnerActionsMenuProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleDeletePost() {
    setIsDeleting(true)
    const typeLabel = TYPE_LABELS[gridType] ?? 'grid'
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', gridUserId)
      .eq('parent_page_type', 'profile')
      .eq('parent_page_id', gridUserId)
      .ilike('content', `%Top ${typeLabel} grid%`)
    setMenuOpen(false)
    setIsDeleting(false)
    if (error) {
      console.error('Error deleting grid update post:', error)
      return
    }
    router.refresh()
  }

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded p-0.5 text-white/70 transition-colors hover:text-white"
        aria-label="Grid post actions"
        aria-expanded={menuOpen}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menuOpen && (
        <div
          className="absolute right-full top-0 z-50 mr-1 min-w-[140px] rounded-lg border border-white/10 bg-[#1D1D1D] py-1 shadow-xl"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
            onClick={handleDeletePost}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            {isDeleting ? 'Deleting...' : 'Delete post'}
          </button>
        </div>
      )}
    </div>
  )
}
