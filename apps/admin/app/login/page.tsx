'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check admin status
        supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
            const isAdminRole = profile?.role === 'admin'
            if (isAdminEmail || isAdminRole) {
              router.push('/dashboard')
            }
          })
      }
    })

    // Listen for auth state changes (for email/password login)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, email')
          .eq('id', session.user.id)
          .maybeSingle()

        const isAdminEmail = session.user.email?.endsWith('@whosonpole.org')
        const isAdminRole = profile?.role === 'admin'

        if (isAdminEmail || isAdminRole) {
          router.push('/dashboard')
        } else {
          // Not an admin, redirect to main site
          router.push('/login')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'apple']}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`}
          onlyThirdPartyProviders={false}
        />
      </div>
    </div>
  )
}

