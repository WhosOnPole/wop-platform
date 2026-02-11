'use client'

import { useEffect, useRef, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const authContainerRef = useRef<HTMLDivElement>(null)
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Use current origin dynamically instead of env var
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

  // Route "Sign in" link in Auth UI to /login
  useEffect(() => {
    if (!authContainerRef.current) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link && (link.textContent?.toLowerCase().includes('sign in') || link.href.includes('sign_in'))) {
        e.preventDefault()
        router.push('/login')
      }
    }
    authContainerRef.current.addEventListener('click', handleClick)
    return () => authContainerRef.current?.removeEventListener('click', handleClick)
  }, [router])

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
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}
        <p className="text-center text-xs text-gray-500">
          If you see &quot;too many requests&quot;, wait a minute and try again.
        </p>
        <button
          type="button"
          onClick={async () => {
            const to = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''
            if (!to) return
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: to },
            })
            if (error) setError(error.message)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
          aria-label="Continue with Google"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
        </button>
        <div className="flex items-center space-x-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        {redirectUrl && (
          <div ref={authContainerRef}>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              view="sign_up"
              providers={[]}
              redirectTo={redirectUrl}
              onlyThirdPartyProviders={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

