import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { TrackTipsQueue } from '@/components/track-tips/track-tips-queue'
import { AdminPageHeader } from '@/components/admin/page-header'

export default async function TrackTipsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch pending track tips with user and track info
  const { data: tips } = await supabase
    .from('track_tips')
    .select(
      `
      *,
      user:profiles!user_id (
        id,
        username
      ),
      track:tracks!track_id (
        id,
        name
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Community Review"
        title="Track Tips Queue"
        description="Review and approve track tips. Approved tips award 2 points to the submitter."
      />
      <TrackTipsQueue initialTips={tips || []} />
    </div>
  )
}

