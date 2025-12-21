'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white lg:bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 lg:shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Join Who&apos;s on Pole?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          view="sign_up"
          providers={['google', 'apple', 'facebook', 'twitter']}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`}
          onlyThirdPartyProviders={false}
        />
      </div>
    </div>
  )
}

