import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { AutoCalculateButton } from '@/components/highlights/auto-calculate-button'
import { HighlightedFanManager } from '@/components/highlights/highlighted-fan-manager'
import { HighlightedSponsorManager } from '@/components/highlights/highlighted-sponsor-manager'
import { AdminPageHeader } from '@/components/admin/page-header'

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
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Spotlight Operations"
        title="Weekly Highlights"
        description="Set the highlighted fan and endorsement for the current week. The week starts on Monday."
        action={<AutoCalculateButton weekStart={weekStart} />}
      />

      {needsHighlights && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">
            Set the featured fan and grid for this week to keep Spotlight Our Picks active.
          </p>
        </div>
      )}

      {currentHighlights?.highlighted_fan && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm font-bold text-teal-900">
            Current Featured Fan: {currentHighlights.highlighted_fan.username}
            {currentHighlights.highlighted_fan.weekly_points !== null && (
              <span className="ml-2 text-teal-700">
                ({currentHighlights.highlighted_fan.weekly_points} weekly points)
              </span>
            )}
          </p>
          {currentHighlights.updated_at && (
            <p className="mt-1 text-xs font-medium text-teal-700">
              Last updated: {new Date(currentHighlights.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {calculationHistory && calculationHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Recent Calculations</h2>
          <div className="space-y-2">
            {calculationHistory.map((highlight) => (
              <div
                key={highlight.id}
                className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 first:pb-0 "
              >
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Week of {new Date(highlight.week_start_date).toLocaleDateString()}
                  </p>
                  {highlight.highlighted_fan && (
                    <p className="text-xs text-slate-600">
                      {highlight.highlighted_fan.username}
                      {highlight.highlighted_fan.weekly_points !== null && (
                        <span> - {highlight.highlighted_fan.weekly_points} points</span>
                      )}
                    </p>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {new Date(highlight.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Highlighted Fan</h2>
          <HighlightedFanManager
            currentWeekStart={weekStart}
            existingFan={currentHighlights?.highlighted_fan || null}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Highlighted Endorsement</h2>
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

