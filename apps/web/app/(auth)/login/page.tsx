'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)
  const [redirectUrl, setRedirectUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRedirectUrl(`${window.location.origin}/auth/callback`)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const tiktokError = params.get('tiktok_error')
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
      if (err === 'tiktok_callback_error') {
        if (tiktokError === 'Non_sandbox_target') {
          setError(
            'TikTok sign-in is not available for this environment yet (app is in sandbox). Please sign in with email or try again later.'
          )
        } else {
          setError(
            'TikTok sign-in was cancelled or could not be completed. Please try again or sign in with email.'
          )
        }
      } else if (err === 'tiktok_config_missing') {
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
        setError('Too many sign-in attempts. Please wait 2–3 minutes and try again.')
      } else {
        setError('Login failed. Please try another method or try again.')
      }
    }
  }, [])

  async function handleOAuth(provider: 'google' | 'apple') {
    if (!redirectUrl) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-black/60 p-8 backdrop-blur-sm">
        <div>
          <h2 className="text-center font-display text-3xl font-normal tracking-tight text-white">
            Sign in to Who&apos;s on Pole?
          </h2>
          <p className="mt-2 text-center text-sm text-white/70">
            Welcome back to the F1 fan community
          </p>
        </div>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => toast.info('Coming Soon!')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/50 transition-colors opacity-60 cursor-not-allowed"
          aria-label="Sign in with TikTok (coming soon)"
        >
          <img src="/icons/tiktok.svg" alt="TikTok" className="h-5 w-5" />
          <span>Sign in with TikTok</span>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          aria-label="Sign in with Google"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Sign in with Google</span>
        </button>
        <button
          type="button"
          onClick={() => toast.info('Coming Soon!')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/50 transition-colors opacity-60 cursor-not-allowed"
          aria-label="Sign in with Apple (coming soon)"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          <span>Sign in with Apple</span>
        </button>
       
        <p className="text-center text-sm text-white/70">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-[#25B4B1] hover:text-[#25B4B1]/90">
            Sign up
          </Link>
        </p>
      </div>
      <p className="mt-6 max-w-md text-center text-xs text-white/50 leading-relaxed">
        This platform is an independent, community-supported fan site and is not affiliated with, endorsed by, sponsored by, or officially connected to Formula 1®, any Formula 1 teams, drivers, sponsors, or affiliated organizations. All trademarks and related intellectual property are the property of their respective owners.
      </p>
    </div>
  )
}
