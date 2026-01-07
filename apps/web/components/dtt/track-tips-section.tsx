import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { MessageSquare } from 'lucide-react'

interface TrackTipsSectionProps {
  trackId: string
}

export async function TrackTipsSection({ trackId }: TrackTipsSectionProps) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  const { data: tips } = await supabase
    .from('track_tips')
    .select(
      `
      *,
      user:profiles!user_id (
        id,
        username,
        profile_image_url
      )
    `
    )
    .eq('track_id', trackId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (!tips || tips.length === 0) {
    return null
  }

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">Track Tips</h2>
      </div>
      <div className="space-y-4">
        {tips.map((tip) => (
          <div key={tip.id} className="rounded-md bg-gray-50 p-4">
            <div className="mb-2 flex items-center space-x-2">
              {tip.user?.profile_image_url ? (
                <img
                  src={tip.user.profile_image_url}
                  alt={tip.user.username}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xs font-medium text-gray-600">
                    {tip.user?.username?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {tip.user?.username || 'Unknown'}
              </span>
            </div>
            <p className="text-gray-700">{tip.tip_content}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

