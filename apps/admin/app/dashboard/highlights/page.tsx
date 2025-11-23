import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WeeklyHighlightsManager } from '@/components/highlights/weekly-highlights-manager'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export default async function HighlightsPage() {
  const supabase = createServerComponentClient({ cookies })
  const weekStart = await getCurrentWeekStart()

  // Fetch current week's highlights
  const { data: currentHighlights } = await supabase
    .from('weekly_highlights')
    .select(
      `
      *,
      highlighted_fan:profiles!highlighted_fan_id (
        id,
        username,
        profile_image_url
      ),
      highlighted_sponsor:sponsors!highlighted_sponsor_id (
        id,
        name,
        logo_url
      )
    `
    )
    .eq('week_start_date', weekStart)
    .single()

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Weekly Highlights</h1>
      <p className="mb-8 text-gray-600">
        Set the highlighted fan and sponsor for the current week. The week starts on Monday.
      </p>

      <WeeklyHighlightsManager
        currentWeekStart={weekStart}
        existingHighlights={currentHighlights}
      />
    </div>
  )
}

