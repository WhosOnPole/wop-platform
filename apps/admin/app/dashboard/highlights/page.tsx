import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WeeklyHighlightsManager } from '@/components/highlights/weekly-highlights-manager'
import { AutoCalculateButton } from '@/components/highlights/auto-calculate-button'
import { HighlightedFanManager } from '@/components/highlights/highlighted-fan-manager'
import { HighlightedSponsorManager } from '@/components/highlights/highlighted-sponsor-manager'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export default async function HighlightsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
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
        profile_image_url,
        weekly_points
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

  // Fetch calculation history (last 5 calculations)
  const { data: calculationHistory } = await supabase
    .from('weekly_highlights')
    .select(
      `
      *,
      highlighted_fan:profiles!highlighted_fan_id (
        username,
        weekly_points
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(5)

  const missingFan = !currentHighlights?.highlighted_fan_id
  const missingGrid = !currentHighlights?.highlighted_fan_grid_id
  const needsHighlights = !currentHighlights || missingFan || missingGrid

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Highlights</h1>
          <p className="mt-2 text-gray-600">
            Set the highlighted fan and sponsor for the current week. The week starts on Monday.
          </p>
        </div>
        <AutoCalculateButton weekStart={weekStart} />
      </div>

      {needsHighlights && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">
            Set the featured fan and grid for this week to keep Spotlight Our Picks active.
          </p>
        </div>
      )}

      {currentHighlights?.highlighted_fan && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">
            Current Featured Fan: {currentHighlights.highlighted_fan.username}
            {currentHighlights.highlighted_fan.weekly_points !== null && (
              <span className="ml-2 text-blue-700">
                ({currentHighlights.highlighted_fan.weekly_points} weekly points)
              </span>
            )}
          </p>
          {currentHighlights.updated_at && (
            <p className="mt-1 text-xs text-blue-700">
              Last updated: {new Date(currentHighlights.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {calculationHistory && calculationHistory.length > 0 && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Calculations</h2>
          <div className="space-y-2">
            {calculationHistory.map((highlight) => (
              <div
                key={highlight.id}
                className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Week of {new Date(highlight.week_start_date).toLocaleDateString()}
                  </p>
                  {highlight.highlighted_fan && (
                    <p className="text-xs text-gray-600">
                      {highlight.highlighted_fan.username}
                      {highlight.highlighted_fan.weekly_points !== null && (
                        <span> - {highlight.highlighted_fan.weekly_points} points</span>
                      )}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(highlight.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Highlighted Fan</h2>
          <HighlightedFanManager
            currentWeekStart={weekStart}
            existingFan={currentHighlights?.highlighted_fan || null}
          />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Highlighted Sponsor</h2>
          <HighlightedSponsorManager
            currentWeekStart={weekStart}
            existingSponsor={currentHighlights?.highlighted_sponsor || null}
          />
        </div>

        {/* Hot take spotlight section removed (deprecated) */}
      </div>
    </div>
  )
}

