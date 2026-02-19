import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Redirect to main settings page with Notifications tab active (notification settings are now in-app). */
export default async function NotificationSettingsRedirect() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  redirect('/settings?tab=settings')
}
