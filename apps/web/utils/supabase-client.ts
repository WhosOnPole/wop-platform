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

function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const status = (err as { status?: number }).status
  const msg = (err as { message?: string }).message ?? ''
  return status === 429 || msg.includes('rate limit') || msg.includes('over_request_rate_limit')
}

const CIRCUIT_BREAKER_MS = 5 * 60 * 1000 // 5 min - stop hitting /token after invalid refresh
const RATE_LIMIT_BACKOFF_MS = 30_000 // 30s minimum wait after 429 before retry
let circuitBreakerUntil = 0
let last429At = 0

/**
 * Dedupes getSession(), adds circuit breaker for 400/429, and exponential backoff for 429.
 * - After 400 (invalid refresh): block all /token for 5 min, clear storage.
 * - After 429: block for 30s minimum, then allow one retry with backoff.
 */
function dedupeAndCircuitBreakGetSession(client: SupabaseClient): void {
  const auth = client.auth as { getSession: () => Promise<{ data: { session: unknown }; error: unknown }> }
  let inFlight: Promise<{ data: { session: unknown }; error: unknown }> | null = null
  const original = auth.getSession.bind(auth)

  auth.getSession = function getSession() {
    const now = Date.now()
    if (sessionInvalidated || now < circuitBreakerUntil) {
      return Promise.resolve({
        data: { session: null },
        error: { message: 'Session invalidated (refresh failed)', status: 400 },
      })
    }
    if (now < last429At + RATE_LIMIT_BACKOFF_MS) {
      return Promise.resolve({
        data: { session: null },
        error: { message: 'Rate limited - backing off', status: 429 },
      })
    }
    if (inFlight) return inFlight

    inFlight = original()
      .then(async (result) => {
        if (result.error && isInvalidRefreshError(result.error)) {
          if (isRateLimitError(result.error)) {
            last429At = Date.now()
            circuitBreakerUntil = Date.now() + RATE_LIMIT_BACKOFF_MS
          } else {
            sessionInvalidated = true
            circuitBreakerUntil = Date.now() + CIRCUIT_BREAKER_MS
          }
          clearSupabaseAuthStorage()
        } else if (result.data?.session) {
          sessionInvalidated = false
          circuitBreakerUntil = 0
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
    const client = createSupabaseClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    })
    clientInstance = client
    dedupeAndCircuitBreakGetSession(client)
  }
  return clientInstance as SupabaseClient
}
