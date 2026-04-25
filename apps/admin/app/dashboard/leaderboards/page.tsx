import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { LeaderboardDashboard } from '@/components/leaderboards/leaderboard-dashboard'
import { AdminPageHeader } from '@/components/admin/page-header'

export default async function LeaderboardsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch latest leaderboard generations
  const { data: weeklyLeaderboard } = await supabase
    .from('leaderboards')
    .select('period_start, created_at')
    .eq('period_type', 'weekly')
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  const { data: monthlyLeaderboard } = await supabase
    .from('leaderboards')
    .select('period_start, created_at')
    .eq('period_type', 'monthly')
    .order('period_start', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Rankings"
        title="Leaderboards"
        description="Generate and manage leaderboard rankings."
      />
      <LeaderboardDashboard
        weeklyLastGenerated={weeklyLeaderboard?.created_at}
        monthlyLastGenerated={monthlyLeaderboard?.created_at}
      />
    </div>
  )
}

