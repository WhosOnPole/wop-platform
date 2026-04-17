'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient, uninstallTokenPkceDedupe } from '@/utils/supabase-client'
import { LoadingLogo } from '@/components/loading-logo'

/**
 * Module-level lock: only one exchange runs per code in the entire app.
 * Second run (e.g. Strict Mode) waits on the same promise instead of calling the API again.
 */
let exchangePromise: Promise<{ destination: string } | { error: true; rateLimited?: boolean }> | null = null
let exchangeCode: string | null = null

function runExchangeOnce(code: string) {
  if (exchangeCode === code && exchangePromise) return exchangePromise
  exchangeCode = code
  exchangePromise = (async () => {
    try {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        const status = (error as { status?: number })?.status
        const isRateLimit = status === 429 || /rate limit|too many requests/i.test(error?.message ?? '')
        return { error: true as const, rateLimited: isRateLimit }
      }
      const session = data?.session
      if (!session) return { error: true as const }
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, date_of_birth')
        .eq('id', session.user.id)
        .maybeSingle()
      const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
      return { destination: isProfileComplete ? '/feed' : '/onboarding' }
    } finally {
      exchangePromise = null
      exchangeCode = null
      queueMicrotask(() => uninstallTokenPkceDedupe())
    }
  })()
  return exchangePromise
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

    let isMounted = true
    runExchangeOnce(code).then((result) => {
      if (!isMounted) return

      if ('error' in result && result.error) {
        router.replace('/login?error=auth_callback_failed')
        return
      }
      if ('destination' in result && result.destination) {
        router.replace(result.destination)
      }
    })
    return () => {
      isMounted = false
    }
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
