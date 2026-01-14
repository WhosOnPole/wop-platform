'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Navbar() {
  const supabase = createClientComponentClient()
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (isMounted) setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkUser()

    const { data } = supabase.auth.onAuthStateChange(() => checkUser())
    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [supabase])

  // Hide top navbar for authenticated users (bottom navbar takes over)
  if (user || loading) return null

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/beginners-guide', label: "Beginner's Guide" },
    { href: '/discussion', label: 'Discussion' },
    { href: '/features', label: 'Features' },
    { href: '/login', label: 'Login' },
  ]

  return (
    <nav className="bg-sunset-gradient relative z-50">
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
                className={`rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:text-[#3BEFEB] ${
                  pathname === item.href ? 'hover:text-[#3BEFEB]' : ''
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
              className="rounded-full bg-background px-6 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Log In
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-sunset-gradient/95 backdrop-blur">
          <div className="space-y-1 border-t border-white/20 px-4 pt-3 pb-6">
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
