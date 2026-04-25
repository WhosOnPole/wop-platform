import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { ChatLogsViewer } from '@/components/chat-logs/chat-logs-viewer'
import { AdminPageHeader } from '@/components/admin/page-header'

export default async function ChatLogsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch all tracks with start dates
  const { data: races } = await supabase
    .from('tracks')
    .select('id, name, start_date')
    .not('start_date', 'is', null)
    .order('start_date', { ascending: false })

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Security Audit"
        title="Live Chat Logs"
        description="View chat logs for any race. This is a read-only security and audit tool."
      />
      <ChatLogsViewer races={races || []} />
    </div>
  )
}

