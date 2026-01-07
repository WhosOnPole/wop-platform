import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { LeaderboardDashboard } from '@/components/leaderboards/leaderboard-dashboard'

export default async function LeaderboardsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore },
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
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Leaderboards</h1>
      <p className="mb-8 text-gray-600">
        Generate and manage leaderboard rankings
      </p>

      <LeaderboardDashboard
        weeklyLastGenerated={weeklyLeaderboard?.created_at}
        monthlyLastGenerated={monthlyLeaderboard?.created_at}
      />
    </div>
  )
}

