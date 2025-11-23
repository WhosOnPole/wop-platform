'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string
  profile_image_url: string | null
}

export function Navbar() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (profileMenuOpen && !target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [profileMenuOpen])

  async function checkUser() {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (session) {
        setUser(session.user)

        // Fetch profile - profile should always exist after onboarding
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, profile_image_url')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          // If profile doesn't exist, user should be redirected to onboarding by middleware
          setProfile(null)
        } else if (profileData) {
          setProfile(profileData)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error in checkUser:', error)
      setUser(null)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = user
    ? [
        { href: '/', label: 'Home' },
        { href: '/drivers', label: 'Drivers' },
        { href: '/teams', label: 'Teams' },
        { href: '/circuits', label: 'Circuits' },
        { href: '/polls', label: 'Polls' },
        { href: '/features', label: 'Features' },
        { href: '/beginners-guide', label: "Beginner's Guide" },
        { href: '/live-chat', label: 'Live Chat' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/features', label: 'Features' },
        { href: '/beginners-guide', label: "Beginner's Guide" },
      ]

  // Logged-out state - brand styling
  if (!user && !loading) {
    return (
      <nav className="bg-sunset-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Logo variant="white" size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 ${
                    pathname === item.href ? 'bg-white/30' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side - Login Button */}
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="rounded-full bg-foundation-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-foundation-black/90"
              >
                Log In
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium text-white ${
                    pathname === item.href ? 'bg-white/30' : 'hover:bg-white/20'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    )
  }

  // Logged-in state - standard styling
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="black" size="md" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side - Auth */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            ) : user && profile ? (
              <div className="relative" data-profile-menu>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-gray-200 transition-all hover:ring-blue-500"
                  title={profile.username}
                  aria-label="Profile menu"
                >
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt={profile.username}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600 text-white">
                      <span className="text-sm font-medium">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="py-1">
                      <Link
                        href={`/u/${profile.username}`}
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      <div className="border-t border-gray-100" />
                      <button
                        onClick={() => {
                          handleSignOut()
                          setProfileMenuOpen(false)
                        }}
                        className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : user && pathname === '/onboarding' ? (
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <span>Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-gray-200 px-2 pt-2 pb-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-base font-medium ${
                  pathname === item.href
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user && profile ? (
              <Link
                href={`/u/${profile.username}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                Profile
              </Link>
            ) : null}
            {user && (
              <button
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                {pathname === '/onboarding' ? 'Logout' : 'Sign Out'}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
