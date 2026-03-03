/**
 * Reads session from storage synchronously (~0.2ms vs ~50-100ms for getSession()).
 * Used for optimistic initial render when user is already logged in.
 * Auth-helpers-nextjs uses cookies; we also check localStorage.
 * See: https://github.com/supabase/supabase-js/issues/970
 */
import type { Session } from '@supabase/supabase-js'

function parseSession(raw: string): Session | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    const session =
      parsed &&
      typeof parsed === 'object' &&
      'session' in parsed &&
      (parsed as { session?: unknown }).session
        ? (parsed as { session: Session }).session
        : (parsed as Session)
    if (session?.user && session?.access_token) {
      return session
    }
  } catch {
    // ignore
  }
  return null
}

export function getStoredSessionSync(): Session | null {
  if (typeof window === 'undefined') return null

  // Auth-helpers-nextjs uses cookies; supports chunked format (sb-xxx-auth-token.0, .1, ...)
  try {
    const cookies = document.cookie.split(';')
    const authCookies: { name: string; value: string }[] = []

    for (const cookie of cookies) {
      const eq = cookie.indexOf('=')
      if (eq < 0) continue
      const name = cookie.slice(0, eq).trim()
      const value = cookie.slice(eq + 1).trim()
      if (!name.startsWith('sb-') || !name.includes('auth') || !value) continue
      authCookies.push({ name, value: decodeURIComponent(value) })
    }

    // Single cookie (no chunks)
    for (const { name, value } of authCookies) {
      if (!name.includes('.')) {
        const session = parseSession(value)
        if (session) return session
      }
    }

    // Chunked: group by base name, merge in order
    const byBase = new Map<string, Map<number, string>>()
    for (const { name, value } of authCookies) {
      const dot = name.lastIndexOf('.')
      if (dot < 0) continue
      const base = name.slice(0, dot)
      const idx = parseInt(name.slice(dot + 1), 10)
      if (isNaN(idx)) continue
      if (!byBase.has(base)) byBase.set(base, new Map())
      byBase.get(base)!.set(idx, value)
    }
    for (const chunks of byBase.values()) {
      const merged = [...chunks.keys()]
        .sort((a, b) => a - b)
        .map((k) => chunks.get(k))
        .join('')
      const session = parseSession(merged)
      if (session) return session
    }
  } catch {
    // ignore
  }

  // Fallback: localStorage (some setups use it)
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('sb-') && key.includes('auth')) {
        const raw = window.localStorage.getItem(key)
        if (raw) {
          const session = parseSession(raw)
          if (session) return session
        }
      }
    }
  } catch {
    // ignore
  }

  return null
}
