import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { EmailQueueDashboard } from '@/components/emails/email-queue-dashboard'

export default async function EmailsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch email queue statistics
  const [
    { count: pendingCount },
    { count: sentCount },
    { count: failedCount },
    { data: recentEmails },
  ] = await Promise.all([
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Email Queue</h1>
      <p className="mb-8 text-gray-600">
        Monitor and manage the email queue. View pending, sent, and failed emails.
      </p>

      <EmailQueueDashboard
        pendingCount={pendingCount || 0}
        sentCount={sentCount || 0}
        failedCount={failedCount || 0}
        recentEmails={recentEmails || []}
      />
    </div>
  )
}

