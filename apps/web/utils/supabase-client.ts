import { createClientComponentClient as createSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clearSupabaseAuthStorage } from '@/utils/clear-auth-storage'

let clientInstance: SupabaseClient | null = null

/** When true, getSession() returns null immediately without calling /token (stops retry storm). */
let sessionInvalidated = false

/** Call after sign-in succeeds (e.g. onAuthStateChange with session) so getSession() works again. */
export function resetSessionInvalidated(): void {
  sessionInvalidated = false
}

function isInvalidRefreshError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = (err as { message?: string }).message ?? ''
  const status = (err as { status?: number }).status
  return (
    msg.includes('Refresh Token') ||
    msg.includes('refresh_token') ||
    status === 400 ||
    status === 429
  )
}

/**
 * Dedupes getSession() and adds a circuit breaker: after the first 400/429,
 * all getSession() calls return null immediately without hitting /token.
 */
function dedupeAndCircuitBreakGetSession(client: SupabaseClient): void {
  const auth = client.auth as { getSession: () => Promise<{ data: { session: unknown }; error: unknown }> }
  let inFlight: Promise<{ data: { session: unknown }; error: unknown }> | null = null
  const original = auth.getSession.bind(auth)
  auth.getSession = function getSession() {
    if (sessionInvalidated) {
      return Promise.resolve({
        data: { session: null },
        error: { message: 'Session invalidated (refresh failed)', status: 400 },
      })
    }
    if (inFlight) return inFlight
    inFlight = original()
      .then((result) => {
        if (result.error && isInvalidRefreshError(result.error)) {
          sessionInvalidated = true
          clearSupabaseAuthStorage()
        } else if (result.data?.session) {
          sessionInvalidated = false
        }
        return result
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }
}

/**
 * Creates a Supabase client for use in client components.
 * Returns a singleton so only one client runs token refresh, avoiding
 * duplicate /token requests and 429 rate limits when refresh fails.
 * getSession() is deduped so concurrent callers share one request.
 */
export function createClientComponentClient() {
  if (typeof window === 'undefined') {
    return createSupabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    })
  }
  if (!clientInstance) {
    clientInstance = createSupabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    })
    dedupeAndCircuitBreakGetSession(clientInstance)
  }
  return clientInstance
}
