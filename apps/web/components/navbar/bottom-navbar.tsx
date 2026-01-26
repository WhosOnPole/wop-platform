'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PlusCircle } from 'lucide-react'
import Image from 'next/image'
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
  icon?: ComponentType<any>
  iconType?: 'svg' | 'image' | 'lucide'
  iconPath?: string
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
    { key: 'feed', label: 'feed', href: '/feed', iconType: 'svg' },
    { key: 'pitlane', label: 'pit lane', href: '/pitlane', iconType: 'svg' },
    { key: 'create', label: 'create', action: 'create', icon: PlusCircle, iconType: 'lucide' },
    { key: 'podiums', label: 'podiums', href: '/podiums', iconType: 'svg' },
    {
      key: 'profile',
      label: 'Profile',
      href: profile?.username ? `/u/${profile.username}` : '/profile',
      iconType: 'svg',
    },
  ]

  function isActive(href?: string) {
    if (!href) return false
    if (href === '/feed') return pathname === '/feed'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1D1D1D] rounded-t-2xl w-[97%] mx-auto">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.action === 'create' && Icon) {
            const isActive = isCreateOpen
            return (
              <div key={item.key} className="relative flex-1 text-center" data-create-menu>
                <button
                  onClick={() => setIsCreateOpen((prev) => !prev)}
                  className="mx-auto flex flex-col items-center justify-center rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none"
                  aria-label="Open create menu"
                >
                  <span className="flex w-14  justify-center">
                    <Icon className={`h-9 w-9 transition-colors ${isActive ? 'text-sunset-gradient' : 'text-[#525252]'}`} strokeWidth={.9} />
                  </span>
                  <span className={`text-xs transition-colors ${isActive ? 'text-white' : 'text-[#525252]'}`}>create</span>
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
              className="flex flex-1 flex-col items-center justify-center rounded-md px-2 py-1 text-xs text-gray-700 transition-colors hover:text-[#EB0E78]"
            >
              {item.iconType === 'image' && item.iconPath ? (
                <Image
                  src={item.iconPath}
                  alt={item.label}
                  width={24}
                  height={24}
                  className={`${active ? 'opacity-100' : 'opacity-60'}`}
                  style={{ width: 'auto', height: 'auto' }}
                />
              ) : item.iconType === 'svg' ? (
                <NavIcon type={item.key} active={active} />
              ) : null}
              <span className={`mt-1 ${active ? 'text-white' : 'text-[#525252] hover:text-[#EB0E78]'}`}>
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

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const fillColor = active ? 'white' : '#525252'
  
  if (type === 'feed') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none" className="h-5 w-5">
        <rect x="0.5" y="0.5" width="15" height="15.5237" rx="5" stroke={fillColor} />
        <line x1="4.25" y1="4.40247" x2="11.875" y2="4.40247" stroke={fillColor} />
        <line x1="4.25" y1="8.06665" x2="11.875" y2="8.06665" stroke={fillColor} />
        <line x1="4.25" y1="12.0148" x2="11.875" y2="12.0148" stroke={fillColor} />
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
        stroke={fillColor}
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
        <path d="M12.4556 7.75488L12.5679 8.10059H19.3843L14.1636 11.8936L13.8696 12.1074L13.9819 12.4531L15.9761 18.5898L10.7554 14.7969L10.4614 14.584L10.1675 14.7969L4.9458 18.5898L6.94092 12.4531L7.05322 12.1074L6.75928 11.8936L1.53857 8.10059H8.35498L8.46729 7.75488L10.4614 1.61719L12.4556 7.75488Z" stroke={fillColor} />
      </svg>
    )
  }
  
  if (type === 'profile') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="16" viewBox="0 0 19 16" fill="none" className="h-5 w-5">
        <circle cx="8.98242" cy="4.5" r="4" stroke={fillColor} />
        <path d="M0.482422 15.5C0.982422 13.6667 3.38242 10 8.98242 10C14.5824 10 17.3158 13.6667 17.9824 15.5" stroke={fillColor} />
      </svg>
    )
  }
  
  return null
}
