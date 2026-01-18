'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Logo } from '@/components/ui/logo'
import { CreateMenu } from '@/components/create/create-menu'
import { StoryModal } from '@/components/create/modals/story-modal'
import { PollModal } from '@/components/create/modals/poll-modal'
import { TipModal } from '@/components/create/modals/tip-modal'
import { PostModal } from '@/components/create/modals/post-modal'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  profile_image_url: string | null
}

export function TopNav() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
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
        console.error('Error loading user in top nav:', error)
      }
    }

    loadUser()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setProfile(null)
        return
      }
      setUser(session.user)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isMenuOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-top-nav-menu]')) setIsMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    if (!isCreateOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (!target.closest('[data-top-nav-create]')) setIsCreateOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCreateOpen])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const profileHref = profile?.username ? `/u/${profile.username}` : '/profile'
  const isAuthed = !!user
  const authedNavItems = [
    { href: '/feed', label: 'Feed' },
    { href: '/pitlane', label: 'Pitlane' },
    { href: '/podiums', label: 'Podiums' },
    { href: profileHref, label: 'Profile' },
  ]
  const unauthNavItems = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/login', label: 'Login' },
  ]

  return (
    <div className="bg-transparenttext-gray-900">
      <div className="flex items-center justify-between p-4">
        <Logo variant="white" href={isAuthed ? '/feed' : '/'} className="h-9"/>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {isAuthed
            ? authedNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'text-[#3BEFEB]'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))
            : unauthNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === item.href
                      ? 'text-[#3BEFEB]'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          {isAuthed ? (
            <div className="relative" data-top-nav-create>
              <button
                onClick={() => setIsCreateOpen((prev) => !prev)}
                className="rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Create
              </button>
              {isCreateOpen ? (
                <CreateMenu
                  onClose={() => setIsCreateOpen(false)}
                  onSelect={(key) => setActiveModal(key)}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right side: profile/menu (authenticated) or links (mobile unauth) */}
        <div className="flex items-center gap-3" data-top-nav-menu>
          {!isAuthed ? (
            <div className="flex md:hidden items-center gap-4">
              {unauthNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          {isAuthed ? (
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
              aria-label="Open profile menu"
            >
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-600">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </button>
          ) : null}

          {isMenuOpen && isAuthed ? (
            <div className="absolute right-4 top-14 w-56 rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg z-50">
              <div className="p-2 space-y-2">
                <button
                  onClick={() => {
                    console.info('TODO: settings route')
                    setIsMenuOpen(false)
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
                <button
                  onClick={() => {
                    setIsInfoOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="w-full rounded-lg bg-gray-900 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Info
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isInfoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Info</h2>
              <button
                onClick={() => setIsInfoOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <details className="rounded-lg border border-gray-200 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Terms of Service</summary>
                <p className="mt-2 text-sm text-gray-600">
                  Placeholder: Terms of Service content will appear here.
                </p>
              </details>

              <details className="rounded-lg border border-gray-200 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Privacy Policy</summary>
                <p className="mt-2 text-sm text-gray-600">
                  Placeholder: Privacy Policy content will appear here.
                </p>
              </details>

              <details className="rounded-lg border border-gray-200 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Release Notes</summary>
                <p className="mt-2 text-sm text-gray-600">
                  Placeholder: Latest production deploy notes will appear here.
                </p>
              </details>
            </div>
          </div>
        </div>
      ) : null}

      {activeModal === 'story' ? <StoryModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'poll' ? <PollModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'tip' ? <TipModal onClose={() => setActiveModal(null)} /> : null}
      {activeModal === 'post' ? <PostModal onClose={() => setActiveModal(null)} /> : null}
    </div>
  )
}
