import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

async function getCurrentMonthStart() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  return firstDay.toISOString().split('T')[0]
}

export default async function LeaderboardPage() {
  const supabase = createServerComponentClient({ cookies })
  const weekStart = await getCurrentWeekStart()
  const monthStart = await getCurrentMonthStart()

  // Fetch leaderboards
  const [
    { data: weeklyLeaderboard },
    { data: monthlyLeaderboard },
    { data: allTimeLeaderboard },
  ] = await Promise.all([
    supabase
      .from('leaderboards')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url,
          points
        )
      `
      )
      .eq('period_type', 'weekly')
      .eq('period_start', weekStart)
      .order('rank', { ascending: true })
      .limit(100),
    supabase
      .from('leaderboards')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url,
          points
        )
      `
      )
      .eq('period_type', 'monthly')
      .eq('period_start', monthStart)
      .order('rank', { ascending: true })
      .limit(100),
    supabase
      .from('profiles')
      .select('id, username, profile_image_url, points')
      .order('points', { ascending: false })
      .limit(100),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Leaderboards</h1>
        <p className="mt-2 text-gray-600">
          See who's leading the pack this week, month, and all-time
        </p>
      </div>

      <LeaderboardView
        weeklyLeaderboard={weeklyLeaderboard || []}
        monthlyLeaderboard={monthlyLeaderboard || []}
        allTimeLeaderboard={allTimeLeaderboard || []}
      />
    </div>
  )
}

