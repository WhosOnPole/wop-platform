'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createClientComponentClient,
  resetSessionInvalidated,
  uninstallTokenPkceDedupe,
} from '@/utils/supabase-client'
import { LoadingLogo } from '@/components/loading-logo'

/**
 * One exchange per OAuth `code` for the lifetime of the page load.
 * React Strict Mode runs effects twice in dev; clearing a lock in `finally` after the first
 * exchange caused a second `exchangeCodeForSession` with the same code → invalid_grant →
 * auth_callback_failed. Cached promises reuse success (or failure) for the same code.
 */
const exchangeByCode = new Map<
  string,
  Promise<{ destination: string } | { error: true; rateLimited?: boolean }>
>()

function runExchangeOnce(code: string) {
  let p = exchangeByCode.get(code)
  if (p) return p

  p = (async () => {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error)
        }
        const status = (error as { status?: number })?.status
        const isRateLimit = status === 429 || /rate limit|too many requests/i.test(error?.message ?? '')
        return { error: true as const, rateLimited: isRateLimit }
      }
      const session = data?.session
      if (!session) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[auth/callback] No session after exchange')
        }
        return { error: true as const }
      }
      resetSessionInvalidated()
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, date_of_birth')
        .eq('id', session.user.id)
        .maybeSingle()
      if (profileError && process.env.NODE_ENV === 'development') {
        console.error('[auth/callback] Profile fetch failed:', profileError.message)
      }
      const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
      return { destination: isProfileComplete ? '/feed' : '/onboarding' }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[auth/callback] Unexpected error:', e)
      }
      return { error: true as const }
    } finally {
      queueMicrotask(() => uninstallTokenPkceDedupe())
    }
  })()

  exchangeByCode.set(code, p)
  return p
}

/**
 * OAuth callback must run on the client because the PKCE code_verifier
 * is stored in the browser by the client that started signInWithOAuth.
 * Only one exchange runs globally (module-level lock) to prevent 429.
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  useEffect(() => {
    if (!code) {
      router.replace('/login')
      return
    }

    if (type === 'recovery') {
      const resetUrl = new URL('/auth/reset-password', window.location.origin)
      resetUrl.searchParams.set('code', code)
      router.replace(resetUrl.pathname + resetUrl.search)
      return
    }

    // Do not gate navigation on isMounted: Strict Mode unmounts before the exchange
    // promise settles, which skipped router.replace and left users on a blank callback.
    runExchangeOnce(code).then((result) => {
      if ('error' in result && result.error) {
        router.replace(
          result.rateLimited ? '/login?error=rate_limit' : '/login?error=auth_callback_failed'
        )
        return
      }
      if ('destination' in result && result.destination) {
        router.replace(result.destination)
      }
    })
  }, [code, type, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black" aria-hidden>
      <LoadingLogo />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black" aria-hidden>
          <LoadingLogo />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
