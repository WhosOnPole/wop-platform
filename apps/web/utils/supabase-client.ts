import { createClientComponentClient as createSupabaseClient } from '@supabase/auth-helpers-nextjs'

/**
 * Creates a Supabase client for use in client components.
 * This wrapper ensures the correct env vars are used (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * instead of the default NEXT_PUBLIC_SUPABASE_ANON_KEY).
 */
export function createClientComponentClient() {
  return createSupabaseClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
}
