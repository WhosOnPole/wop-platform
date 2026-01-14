'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { LayoutGrid, Flag, PlusCircle, Award, User as UserIcon } from 'lucide-react'
import { CreateMenu } from '@/components/create/create-menu'
import { StoryModal } from '@/components/create/modals/story-modal'
import { PollModal } from '@/components/create/modals/poll-modal'
import { TipModal } from '@/components/create/modals/tip-modal'
import { PostModal } from '@/components/create/modals/post-modal'

interface Profile {
  id: string
  username: string
  profile_image_url: string | null
}

interface NavItem {
  key: string
  label: string
  href?: string
  icon: ComponentType<{ className?: string }>
  action?: 'create'
}

export function BottomNavbar() {
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'story' | 'poll' | 'tip' | 'post' | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          if (isMounted) {
            setUser(null)
            setProfile(null)
          }
          return
        }

        if (isMounted) setUser(session.user)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, profile_image_url')
          .eq('id', session.user.id)
          .single()

        if (isMounted && profileData) setProfile(profileData)
      } catch (error) {
        console.error('Error loading user in bottom navbar:', error)
        if (isMounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [supabase])

  useEffect(() => {
    if (!isCreateOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-create-menu]')) setIsCreateOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCreateOpen])

  if (loading || !user) return null

  const navItems: NavItem[] = [
    { key: 'feed', label: 'Feed', href: '/feed', icon: LayoutGrid },
    { key: 'pitlane', label: 'Pitlane', href: '/pitlane', icon: Flag },
    { key: 'create', label: 'Create', action: 'create', icon: PlusCircle },
    { key: 'podiums', label: 'Podiums', href: '/podiums', icon: Award },
    {
      key: 'profile',
      label: 'Profile',
      href: profile?.username ? `/u/${profile.username}` : '/profile',
      icon: UserIcon,
    },
  ]

  function isActive(href?: string) {
    if (!href) return false
    if (href === '/feed') return pathname === '/feed'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-2 py-2 sm:px-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.action === 'create') {
            return (
              <div key={item.key} className="relative flex-1 text-center" data-create-menu>
                <button
                  onClick={() => setIsCreateOpen((prev) => !prev)}
                  className="mx-auto flex flex-col items-center justify-center rounded-full px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:text-blue-600 focus:outline-none"
                  aria-label="Open create menu"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-1 text-xs font-semibold text-gray-900">Create</span>
                </button>
                {isCreateOpen ? (
                  <CreateMenu
                    onClose={() => setIsCreateOpen(false)}
                    onSelect={(key) => setActiveModal(key)}
                  />
                ) : null}
              </div>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href || '#'}
              className="flex flex-1 flex-col items-center justify-center rounded-md px-2 py-1 text-xs font-semibold text-gray-700 transition-colors hover:text-blue-600"
            >
              <Icon
                className={`h-6 w-6 ${active ? 'text-blue-600' : 'text-gray-600'}`}
              />
              <span className={`mt-1 ${active ? 'text-blue-600' : 'text-gray-700'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
      {activeModal === 'story' ? (
        <StoryModal onClose={() => setActiveModal(null)} />
      ) : null}
      {activeModal === 'poll' ? <PollModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'tip' ? <TipModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'post' ? <PostModal onClose={() => setActiveModal(null)} /> : null}
    </nav>
  )
}
