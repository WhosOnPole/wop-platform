/**
 * Clears Supabase auth session from localStorage without calling the server.
 * Use this when refresh fails (400/429) to stop the client from retrying with
 * a bad token and avoid hundreds of /token requests.
 */
export function clearSupabaseAuthStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key && (key.startsWith('sb-') && key.includes('auth'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // ignore
  }
}
