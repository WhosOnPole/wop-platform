import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NotificationSettings } from '@/components/notifications/notification-settings'

export const runtime = 'nodejs'

export default async function NotificationSettingsPage() {
  const cookieGetter = () => cookies()
  // @ts-expect-error Next 15 cookies() returns a Promise; auth-helper types expect sync cookies.
  const supabase = createServerComponentClient({ cookies: cookieGetter })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch user's notification preferences
  const { data: preferences } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage how and when you receive notifications
        </p>
      </div>

      <NotificationSettings initialPreferences={preferences} />
    </div>
  )
}

