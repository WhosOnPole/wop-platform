'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export function PasswordRecoveryCheck() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const hasChecked = useRef(false)

  useEffect(() => {
    // Only check once
    if (hasChecked.current) return
    hasChecked.current = true

    const checkPasswordRecovery = async () => {
      const code = searchParams.get('code')
      const type = searchParams.get('type')

      // If we have a code and type=recovery in URL, redirect to reset password
      if (code && type === 'recovery') {
        const resetUrl = `/auth/reset-password?code=${code}`
        router.replace(resetUrl)
        return
      }

      // Check current session - if it's a password recovery session
      // Supabase recovery sessions have limited scope
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Listen for PASSWORD_RECOVERY event
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
          if (event === 'PASSWORD_RECOVERY' && currentSession) {
            const urlCode = searchParams.get('code')
            if (urlCode) {
              router.replace(`/auth/reset-password?code=${urlCode}`)
            } else {
              // Redirect to reset password - it will handle the session
              router.replace('/auth/reset-password')
            }
          }
        })

        // Also check if we came from a password reset link
        // by checking the referrer or session metadata
        // For now, we rely on the URL params and auth state change event
        
        return () => {
          subscription.unsubscribe()
        }
      }
    }

    checkPasswordRecovery()
  }, [router, searchParams, supabase])

  return null
}

