'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClientComponentClient, resetSessionInvalidated } from '@/utils/supabase-client'
import { clearSupabaseAuthStorage } from '@/utils/clear-auth-storage'

interface AuthSessionContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  /** Call only when you must force a session check (e.g. after an action). Prefer using session from context. */
  refreshSession: () => Promise<void>
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

/**
 * Single source of truth for auth session.
 * - Calls getSession() once on mount (deduped by supabase-client).
 * - Subscribes to onAuthStateChange for updates.
 * - Avoids repeated getSession on navigation or multiple component mounts.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabaseRef = useRef<ReturnType<typeof createClientComponentClient> | null>(null)
  const initRan = useRef(false)

  const refreshSession = useCallback(async () => {
    const supabase = supabaseRef.current ?? createClientComponentClient()
    supabaseRef.current = supabase
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
  }, [])

  useEffect(() => {
    if (initRan.current) return
    initRan.current = true

    const supabase = createClientComponentClient()
    supabaseRef.current = supabase

    async function initSession() {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        const isInvalidRefresh =
          msg.includes('Refresh Token') ||
          msg.includes('refresh_token') ||
          (error as { status?: number }).status === 400 ||
          (error as { status?: number }).status === 429
        if (isInvalidRefresh) {
          clearSupabaseAuthStorage()
        }
        setSession(null)
      } else {
        setSession(data.session)
        if (data.session) resetSessionInvalidated()
      }
      setIsLoading(false)
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (newSession) resetSessionInvalidated()
      if (event === 'SIGNED_OUT') clearSupabaseAuthStorage()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthSessionContextValue = {
    session,
    user: session?.user ?? null,
    isLoading,
    refreshSession,
  }

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  )
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext)
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider')
  }
  return ctx
}

/** Optional hook - returns null if outside provider (for components that may render in both contexts). */
export function useAuthSessionOptional(): AuthSessionContextValue | null {
  return useContext(AuthSessionContext)
}
