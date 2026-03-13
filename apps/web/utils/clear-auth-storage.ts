/**
 * Clears Supabase auth session from localStorage and cookies without calling the server.
 * Use this when refresh fails (400/429) so the bad token is not sent again (e.g. by
 * middleware on next load), avoiding a refresh-token storm and rate limits.
 */
export function clearSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && key.startsWith('sb-') && key.includes('auth')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))

    // Clear auth cookies so middleware and next request don't send the bad refresh token
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eq = cookie.indexOf('=')
      if (eq < 0) continue
      const name = cookie.slice(0, eq).trim()
      if (!name.startsWith('sb-') || !name.includes('auth')) continue
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
    }
  } catch {
    // ignore
  }
}
