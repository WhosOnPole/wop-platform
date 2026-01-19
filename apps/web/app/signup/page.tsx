'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    // Use current origin dynamically instead of env var
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

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
        {redirectUrl && (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            view="sign_up"
            providers={['google']}
            redirectTo={redirectUrl}
            onlyThirdPartyProviders={false}
          />
        )}
      </div>
    </div>
  )
}

