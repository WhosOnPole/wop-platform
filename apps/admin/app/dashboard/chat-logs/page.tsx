import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ChatLogsViewer } from '@/components/chat-logs/chat-logs-viewer'

export default async function ChatLogsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch all race schedules
  const { data: races } = await supabase
    .from('race_schedule')
    .select('id, name, slug, race_time')
    .order('race_time', { ascending: false })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Live Chat Logs</h1>
      <p className="mb-8 text-gray-600">
        View chat logs for any race. This is a read-only security/audit tool.
      </p>

      <ChatLogsViewer races={races || []} />
    </div>
  )
}

