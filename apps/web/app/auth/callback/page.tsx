'use client'

import { useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import { LoadingLogo } from '@/components/loading-logo'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRun = useRef(false)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    if (type === 'recovery' && code) {
      const resetUrl = new URL('/auth/reset-password', window.location.origin)
      resetUrl.searchParams.set('code', code)
      router.replace(resetUrl.pathname + resetUrl.search)
      return
    }

    if (!code) {
      router.replace('/login')
      return
    }

    const codeForExchange: string = code
    const supabase = createClientComponentClient()
    let isMounted = true

    async function runExchange() {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(codeForExchange)
      if (!isMounted) return

      if (exchangeError) {
        router.replace('/login?error=auth_callback_failed')
        return
      }

      const session = data?.session
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, date_of_birth')
        .eq('id', session.user.id)
        .maybeSingle()

      const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
      router.replace(isProfileComplete ? '/feed' : '/onboarding')
    }

    runExchange()
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
