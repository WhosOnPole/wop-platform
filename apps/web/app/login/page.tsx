'use client'

import { useState, useEffect, useRef } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const authContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router, supabase])

  // Monitor for view changes by intercepting toggle link clicks
  useEffect(() => {
    if (!authContainerRef.current) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link) {
        if (link.textContent?.toLowerCase().includes('sign up') || link.href.includes('sign_up')) {
          setView('sign_up')
        } else if (link.textContent?.toLowerCase().includes('sign in') || link.href.includes('sign_in')) {
          setView('sign_in')
        }
      }
    }

    authContainerRef.current.addEventListener('click', handleClick)
    return () => {
      authContainerRef.current?.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {view === 'sign_in' ? 'Sign in to' : 'Join'} Who&apos;s on Pole?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {view === 'sign_in'
              ? 'Welcome back to the F1 fan community'
              : 'Create your account to get started'}
          </p>
        </div>
        <div ref={authContainerRef}>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'apple', 'facebook', 'twitter']}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
            onlyThirdPartyProviders={false}
            view={view}
          />
        </div>
      </div>
    </div>
  )
}

