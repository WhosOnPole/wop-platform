'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useAuthSession } from '@/components/providers/auth-session-provider'
import { getAvatarUrl } from '@/utils/avatar'
import { Logo } from '@/components/ui/logo'
import { CreateMenu } from '@/components/create/create-menu'
import dynamic from 'next/dynamic'
import { NotificationBell } from '@/components/navbar/notification-bell'
import { useCreateModal } from '@/components/providers/create-modal-provider'
import { PlusCircle, Settings, LogOut, Search } from 'lucide-react'

const StoryModal = dynamic(
  () => import('@/components/create/modals/story-modal').then((mod) => mod.StoryModal),
  { ssr: false }
)
const PollModal = dynamic(
  () => import('@/components/create/modals/poll-modal').then((mod) => mod.PollModal),
  { ssr: false }
)
const TipModal = dynamic(
  () => import('@/components/create/modals/tip-modal').then((mod) => mod.TipModal),
  { ssr: false }
)
const PostModal = dynamic(
  () => import('@/components/create/modals/post-modal').then((mod) => mod.PostModal),
  { ssr: false }
)
const GlobalSearchModal = dynamic(
  () => import('@/components/search/global-search-modal').then((mod) => mod.GlobalSearchModal),
  { ssr: false }
)

interface Profile {
  id: string
  username: string
  profile_image_url: string | null
  nav_glow_dismissed_at?: string | null
}

export function TopNav() {
  const supabase = createClientComponentClient()
  const { user } = useAuthSession()
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const createModal = useCreateModal()
  const activeModal = createModal?.activeModal ?? null
  const setActiveModal = createModal?.setActiveModal ?? (() => {})
  const closeModal = createModal?.closeModal ?? (() => {})
  const openPostModal = createModal?.openPostModal ?? (() => {})
  const postModalRef = createModal?.postModalRef ?? null
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [navGlowDismissedInSession, setNavGlowDismissedInSession] = useState(false)

  const showNavGlow =
    !!profile && profile.nav_glow_dismissed_at == null && !navGlowDismissedInSession

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    let isMounted = true
    supabase
      .from('profiles')
      .select('id, username, profile_image_url, nav_glow_dismissed_at')
      .eq('id', user.id)
      .single()
      .then(({ data: profileData }) => {
        if (isMounted && profileData) setProfile(profileData)
      })
    return () => { isMounted = false }
  }, [user, supabase])

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
      if (!target.closest('[data-create-menu]')) setIsCreateOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isCreateOpen])

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 8)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  const profileHref = profile?.username ? `/u/${profile.username}` : '/profile'
  const isAuthed = !!user
  const authedNavItems = [
    { href: profileHref, label: 'Profile' },
    { href: '/feed', label: 'Feed' },
    { href: '/pitlane', label: 'Pit Lane' },
    { href: '/podiums', label: 'Spotlight' },
  ]
  const mobileDropdownItems = [
    { href: profileHref, label: 'Profile', type: 'profile' as const },
    { href: '/feed', label: 'Feed', type: 'feed' as const },
    { href: '/pitlane', label: 'Pit Lane', type: 'pitlane' as const },
    { href: '/podiums', label: 'Spotlight', type: 'podiums' as const },
  ]

  async function handleLogout() {
    setIsMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
  }
  const unauthNavItems = [
    { href: '/#who-we-are', label: 'About Us' },
    { href: '/#features', label: 'Features' },
    { href: '/login', label: 'Login/Signup' },
  ]

  function isActive(href?: string) {
    if (!href) return false
    if (href === '/feed') return pathname === '/feed'
    return pathname.startsWith(href)
  }

  const showNavBg = hasScrolled

  return (
    <div
      className={`fixed top-0 left-0 right-0 text-white z-50 transition-[background] ease-in-out duration-800 ${
        showNavBg
          ? 'bg-[linear-gradient(to_bottom,black_0%,black_40%,transparent_100%)]'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <Logo variant="white" href={isAuthed ? '/feed' : '/'} className="h-9"/>

        {/* Desktop nav - regular text links, right-aligned */}
        <div className="hidden md:flex items-center gap-8 ml-auto mr-8">
          {isAuthed ? (
            <>
              {/* Create - first in list with dropdown */}
              <div className="relative" data-top-nav-create>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen((prev) => !prev)}
                  className={`text-sm font-semibold transition-colors ${
                    isCreateOpen
                      ? 'text-sunset-start'
                      : 'text-white hover:text-sunset-start'
                  }`}
                  aria-label="Create"
                >
                  Create
                </button>
                {isCreateOpen ? (
                  <CreateMenu
                    onClose={() => setIsCreateOpen(false)}
                    onSelect={(key) => (key === 'post' ? openPostModal() : setActiveModal(key))}
                  />
                ) : null}
              </div>
              {/* Other nav items */}
              {authedNavItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-semibold transition-colors ${
                      active
                        ? 'text-[#25B4B1]'
                        : 'text-white hover:text-[#25B4B1]'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </>
          ) : (
            unauthNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-colors ${
                  pathname === item.href
                    ? 'text-[#25B4B1]'
                    : 'text-white hover:text-sunset-start'
                }`}
              >
                {item.label}
              </Link>
            ))
          )}
        </div>

        {/* Mobile nav strip hidden when authed; nav items live in profile dropdown */}
        {isAuthed ? null : (
          <div className="flex md:hidden items-center gap-3" aria-hidden />
        )}

        {/* Right side: profile/menu (authenticated) or links (mobile unauth) */}
        <div className="flex items-center gap-3" data-top-nav-menu>
          {!isAuthed ? (
            <Link
              href="/login"
              className="rounded-full bg-black px-4 py-2 text-xs text-white transition-opacity hover:opacity-90 md:hidden"
            >
              Login
            </Link>
          ) : null}

          {isAuthed ? (
            <>
              <NotificationBell currentUsername={profile?.username} />
              <span
                className={`inline-flex rounded-full ${showNavGlow ? 'animate-nav-glow' : ''}`}
              >
                <button
                  onClick={async () => {
                    if (showNavGlow && user) {
                      setNavGlowDismissedInSession(true)
                      await supabase
                        .from('profiles')
                        .update({ nav_glow_dismissed_at: new Date().toISOString() })
                        .eq('id', user.id)
                    }
                    setIsMenuOpen((prev) => !prev)
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm"
                  aria-label="Open profile menu"
                >
                  <img
                    src={getAvatarUrl(profile?.profile_image_url)}
                    alt={profile?.username ?? 'User'}
                    className="h-full w-full rounded-full object-cover"
                  />
                </button>
              </span>
            </>
          ) : null}

          {isMenuOpen && isAuthed ? (
            <div className="absolute right-4 top-14 rounded-xl border border-gray-200/20 bg-black/80 backdrop-blur-sm text-white z-50 overflow-visible" data-top-nav-dropdown>
              {/* Desktop: Settings + Logout only */}
              <div className="hidden md:block p-2 min-w-[12rem]">
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#6B6B6B] hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[#6B6B6B] hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile: Feed, Pitlane, Spotlight, Profile, Create as circles */}
              <div className="md:hidden p-4 px-6">
                <div className="flex flex-col gap-4 items-start">
                  <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsSearchOpen(true)
                      }}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-sm hover:bg-sunset-gradient"
                      aria-label="Search"
                    >
                      <Search className="h-5 w-5 text-white" />
                    </button>
                    <Link
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="relative flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-sm hover:bg-sunset-gradient"
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5 text-white" />
                    </Link>
                  </div>
                  {mobileDropdownItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-row items-center gap-4"
                        aria-label={item.label}
                      >
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                            active
                              ? 'bg-sunset-gradient text-white'
                              : 'border border-white/30 text-white/30 hover:bg-gray-200'
                          }`}
                        >
                          <NavIcon type={item.type} active={active} variant="circular" />
                        </span>
                        <span className="text-sm font-medium  text-white">{item.label}</span>
                      </Link>
                    )
                  })}
                  <div className="flex flex-row items-center gap-3 relative" data-create-menu>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsCreateOpen((prev) => !prev)
                      }}
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none shadow-lg ${
                        isCreateOpen
                          ? 'bg-gradient-to-r from-[#EC553E] to-[#EB0E78] text-white'
                          : 'border border-white/20 text-white/30'
                      }`}
                      aria-label="Create"
                    >
                      <PlusCircle className="h-6 w-6" strokeWidth={0.9} />
                    </button>
                    <span className="text-sm font-medium text-white">Create</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {activeModal === 'story' ? <StoryModal onClose={closeModal} /> : null}
      {activeModal === 'poll' ? <PollModal onClose={closeModal} /> : null}
      {activeModal === 'tip' ? <TipModal onClose={closeModal} /> : null}
      {activeModal === 'post' ? (
        <PostModal
          onClose={closeModal}
          referencePollId={postModalRef?.referencePollId}
          referencePollQuestion={postModalRef?.referencePollQuestion}
        />
      ) : null}
      <GlobalSearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {isCreateOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 animate-create-overlay-in"
            aria-label="Close create menu"
            onClick={() => setIsCreateOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 animate-create-sheet-in" data-create-menu>
            <div className="max-h-[80vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#1D1D1D]">
              <div className="px-6 pt-5 pb-4 text-center text-sm font-semibold text-white">
                Create
              </div>
              <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+24px)]">
                <CreateMenu
                  variant="sheet"
                  onClose={() => setIsCreateOpen(false)}
                  onSelect={(key) => (key === 'post' ? openPostModal() : setActiveModal(key))}
                />
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes create-sheet-in {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
            @keyframes create-overlay-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-create-sheet-in {
              animation: create-sheet-in 240ms ease-out;
            }
            .animate-create-overlay-in {
              animation: create-overlay-in 160ms ease-out;
            }
          `}</style>
        </div>
      ) : null}
    </div>
  )
}

function NavIcon({ type, active, variant = 'dropdown' }: { type: string; active: boolean; variant?: 'circular' | 'dropdown' }) {
  const fillColor = variant === 'circular' 
    ? (active ? '#FFFFFF' : '#838383')
    : (active ? '#000000' : '#6B6B6B')
  const strokeColor = variant === 'circular'
    ? (active ? '#FFFFFF' : '#838383')
    : (active ? '#000000' : '#6B6B6B')
  
  if (type === 'feed') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none" className="h-5 w-5">
        <rect x="0.5" y="0.5" width="15" height="15.5237" rx="5" stroke={strokeColor} />
        <line x1="4.25" y1="4.40247" x2="11.875" y2="4.40247" stroke={strokeColor} />
        <line x1="4.25" y1="8.06665" x2="11.875" y2="8.06665" stroke={strokeColor} />
        <line x1="4.25" y1="12.0148" x2="11.875" y2="12.0148" stroke={strokeColor} />
      </svg>
    )
  }
  
  if (type === 'pitlane') {
    return (
      <svg
        fill={fillColor}
        version="1.1"
        id="Capa_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 453.405 453.405"
        xmlSpace="preserve"
        stroke={strokeColor}
        className="h-5 w-5"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="6.34767"></g>
        <g id="SVGRepo_iconCarrier">
          <g>
            <g>
              <path d="M382.08,60.394c-26.324-4.534-53.444-0.845-79.764,1.751c-26.223,2.587-53.604,5.753-79.585-0.397 c-30.592-7.241-49.945-27.294-64.216-54.464c-3.935,10.646-7.869,21.291-11.803,31.938 c-25.74,69.646-51.479,139.292-77.218,208.938L0,436.203l26.838,9.919l62.541-169.227c11.607,12.383,25.937,21.375,44.333,25.729 c25.979,6.146,53.363,2.986,79.584,0.398c26.318-2.601,53.441-6.287,79.765-1.752c33.826,5.826,55.682,26.086,71.323,55.871 c29.677-80.291,59.348-160.583,89.021-240.876C437.761,86.479,415.911,66.222,382.08,60.394z M385.379,203.349 c-13.234-11.169-27.441-18.638-44.57-21.931c-5.715,15.458-11.428,30.916-17.141,46.374c17.131,3.295,31.335,10.764,44.572,21.932 c-5.239,14.176-10.479,28.353-15.717,42.526c-13.234-11.168-27.443-18.642-44.573-21.93c5.239-14.177,10.479-28.353,15.718-42.528 c-17.442-2.813-34.473-2.797-52.072-1.72c-5.238,14.176-10.479,28.353-15.717,42.528c-18.21,1.471-36.358,3.56-54.567,5.028 c5.238-14.178,10.478-28.353,15.716-42.526c-17.599,1.078-34.631,1.096-52.073-1.719c-5.239,14.176-10.478,28.352-15.717,42.526 c-17.128-3.29-31.341-10.763-44.572-21.933c5.238-14.174,10.478-28.351,15.716-42.525c13.236,11.17,27.442,18.64,44.573,21.932 c5.712-15.458,11.427-30.918,17.139-46.376c-17.13-3.285-31.338-10.766-44.573-21.93c5.714-15.46,11.427-30.92,17.14-46.378 c13.236,11.173,27.442,18.635,44.572,21.933c5.239-14.176,10.478-28.351,15.717-42.525c17.442,2.813,34.476,2.797,52.073,1.717 c-5.238,14.175-10.478,28.351-15.717,42.526c18.209-1.471,36.357-3.558,54.567-5.028c5.238-14.175,10.479-28.351,15.717-42.527 c17.601-1.078,34.629-1.095,52.072,1.719c-5.239,14.176-10.478,28.351-15.717,42.528c17.131,3.294,31.335,10.761,44.573,21.93 C396.806,172.431,391.095,187.891,385.379,203.349z"></path>
              <path d="M234.167,184.726c-5.713,15.459-11.426,30.917-17.14,46.376c18.21-1.472,36.359-3.56,54.568-5.03 c5.713-15.457,11.426-30.916,17.139-46.374C270.523,181.169,252.376,183.257,234.167,184.726z"></path>
              <path d="M234.167,184.726c5.714-15.458,11.427-30.918,17.14-46.375c-17.604,1.075-34.629,1.093-52.075-1.718 c-5.713,15.458-11.426,30.917-17.139,46.375C199.536,185.824,216.566,185.807,234.167,184.726z"></path>
              <path d="M305.873,133.323c-5.713,15.458-11.426,30.916-17.139,46.375c17.601-1.075,34.629-1.093,52.073,1.72 c5.712-15.458,11.426-30.917,17.138-46.375C340.503,132.229,323.474,132.243,305.873,133.323z"></path>
            </g>
          </g>
        </g>
      </svg>
    )
  }
  
  if (type === 'podiums') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none" className="h-5 w-5">
        <path d="M12.4556 7.75488L12.5679 8.10059H19.3843L14.1636 11.8936L13.8696 12.1074L13.9819 12.4531L15.9761 18.5898L10.7554 14.7969L10.4614 14.584L10.1675 14.7969L4.9458 18.5898L6.94092 12.4531L7.05322 12.1074L6.75928 11.8936L1.53857 8.10059H8.35498L8.46729 7.75488L10.4614 1.61719L12.4556 7.75488Z" stroke={strokeColor} />
      </svg>
    )
  }
  
  if (type === 'profile') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="16" viewBox="0 0 19 16" fill="none" className="h-5 w-5">
        <circle cx="8.98242" cy="4.5" r="4" stroke={strokeColor} />
        <path d="M0.482422 15.5C0.982422 13.6667 3.38242 10 8.98242 10C14.5824 10 17.3158 13.6667 17.9824 15.5" stroke={strokeColor} />
      </svg>
    )
  }
  
  return null
}
