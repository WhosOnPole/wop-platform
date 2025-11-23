import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ReportsQueue } from '@/components/reports/reports-queue'

export default async function ReportsPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch pending reports with reporter info
  const { data: reports } = await supabase
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reporter_id (
        id,
        username
      )
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Reports Queue</h1>
      <p className="mb-8 text-gray-600">
        Review and resolve user reports. Removing content will deduct 5 points and add 1 strike to
        the content owner.
      </p>

      <ReportsQueue initialReports={reports || []} />
    </div>
  )
}

