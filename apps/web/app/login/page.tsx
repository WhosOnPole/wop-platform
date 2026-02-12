'use client'

import { useState, useEffect, useRef } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const authContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    // Use current origin dynamically instead of env var
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

  useEffect(() => {
    // Avoid useSearchParams to prevent Next.js prerender bailout in builds
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const reason = params.get('reason')
    const kind = params.get('kind')
    const role = params.get('role')
    const logId = params.get('log_id')
    const status = params.get('status')
    const code = params.get('code')
    const refParts = [
      status ? `status=${status}` : null,
      code ? `code=${code}` : null,
      logId ? `log_id=${logId}` : null,
      reason ? `reason=${reason}` : null,
      kind ? `kind=${kind}` : null,
      role ? `role=${role}` : null,
    ].filter(Boolean)
    const refSuffix = refParts.length ? ` (ref: ${refParts.join(', ')})` : ''
    if (err) {
      if (err === 'tiktok_config_missing') {
        setError(
          'TikTok login is not configured. Please ensure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET environment variables are set in Vercel and the deployment has been redeployed.'
        )
      } else if (err === 'supabase_config_missing') {
        setError(
          'TikTok login is not configured on the server. Please set SUPABASE_SECRET_KEY (service role key) in Vercel and redeploy.'
        )
      } else if (err === 'supabase_service_key_invalid') {
        setError(
          `TikTok login is misconfigured on the server: the Supabase key provided is not a service-role key.${refSuffix}`
        )
      } else if (err === 'tiktok_state_mismatch') {
        setError(`Security check failed. Please try again.${refSuffix}`)
      } else if (err === 'tiktok_pkce_missing') {
        setError('Security verification failed. Please try again.')
      } else if (err === 'tiktok_token') {
        setError(`Failed to authenticate with TikTok. Please try again.${refSuffix}`)
      } else if (err === 'tiktok_create_user' || err === 'tiktok_signin') {
        setError(`Failed to create/sign in account. Please try again.${refSuffix}`)
      } else if (err === 'auth_callback_failed') {
        setError('Sign-in could not be completed. Please try again.')
      } else if (err === 'rate_limit' || err === 'over_request_rate_limit') {
        setError('Too many sign-in attempts. Please wait a minute and try again.')
      } else {
        setError('Login failed. Please try another method or try again.')
      }
    }
  }, [])

  // Send "Sign up" link to /signup; "Sign in" stays on login page (view toggle)
  useEffect(() => {
    if (!authContainerRef.current) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      if (link) {
        if (link.textContent?.toLowerCase().includes('sign up') || link.href.includes('sign_up')) {
          e.preventDefault()
          router.push('/signup')
        } else if (link.textContent?.toLowerCase().includes('sign in') || link.href.includes('sign_in')) {
          setView('sign_in')
        }
      }
    }

    authContainerRef.current.addEventListener('click', handleClick)
    return () => {
      authContainerRef.current?.removeEventListener('click', handleClick)
    }
  }, [router])

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
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <p className="text-center text-xs text-gray-500">
          If you see &quot;too many requests&quot;, wait a minute and try again.
        </p>
        <button
          onClick={() => (window.location.href = '/api/auth/tiktok')}
          className="flex w-full items-center justify-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
          aria-label="Continue with TikTok"
        >
          <img src="/icons/tiktok.svg" alt="TikTok" className="h-5 w-5" />
          <span>Continue with TikTok</span>
        </button>
        <div className="flex items-center space-x-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
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
              providers={[]}
              onlyThirdPartyProviders={false}
              view={view}
            />
          </div>
        )}
      </div>
    </div>
  )
}

