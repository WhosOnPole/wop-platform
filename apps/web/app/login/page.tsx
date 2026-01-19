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
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      }
    })
  }, [router, supabase])

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
      } else {
        setError('Login failed. Please try another method or try again.')
      }
    }
  }, [])

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
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
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
        {redirectUrl && (
          <div ref={authContainerRef}>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              redirectTo={redirectUrl}
              onlyThirdPartyProviders={false}
              view={view}
            />
          </div>
        )}
      </div>
    </div>
  )
}

