'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useAuthSession } from '@/components/providers/auth-session-provider'

/**
 * Minimal layout for auth routes (login, signup). Handles redirect when user
 * is already logged in. No TopNav, Footer, or other heavy layout components.
 */
export function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useAuthSession()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!session || (pathname !== '/login' && pathname !== '/signup')) return
    let isMounted = true
    supabase
      .from('profiles')
      .select('username, date_of_birth')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
        if (isMounted) router.replace(isProfileComplete ? '/feed' : '/onboarding')
      })
    return () => {
      isMounted = false
    }
  }, [session, pathname, router, supabase])

  return <>{children}</>
}
