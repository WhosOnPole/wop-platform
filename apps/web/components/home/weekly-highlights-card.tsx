import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, TrendingUp, Award } from 'lucide-react'

interface WeeklyHighlightsCardProps {
  weekStart: string
}

export async function WeeklyHighlightsCard({ weekStart }: WeeklyHighlightsCardProps) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch current week's highlights
  const { data: highlights } = await supabase
    .from('weekly_highlights')
    .select(
      `
      *,
      highlighted_fan:profiles!highlighted_fan_id (
        id,
        username,
        profile_image_url,
        weekly_points,
        points,
        city,
        country
      )
    `
    )
    .eq('week_start_date', weekStart)
    .single()

  if (!highlights?.highlighted_fan) {
    return null
  }

  const fan = highlights.highlighted_fan

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 shadow-lg">
      <div className="mb-4 flex items-center space-x-2">
        <Trophy className="h-6 w-6 text-racing-orange" />
        <h2 className="text-2xl font-bold text-foundation-black">
          Featured Fan of the Week
        </h2>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-x-6 md:space-y-0">
        {/* Profile Section */}
        <div className="flex items-center space-x-4">
          <Link href={`/u/${fan.username}`} className="group">
            {fan.profile_image_url ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-racing-orange ring-2 ring-yellow-300 transition-transform group-hover:scale-105">
                <Image
                  src={fan.profile_image_url}
                  alt={fan.username}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-racing-orange bg-gray-200 ring-2 ring-yellow-300">
                <span className="text-2xl font-bold text-gray-600">
                  {fan.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/u/${fan.username}`}
              className="text-xl font-bold text-foundation-black hover:text-racing-orange transition-colors"
            >
              {fan.username}
            </Link>
            {(fan.city || fan.country) && (
              <p className="text-sm text-gray-600">
                {[fan.city, fan.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>Weekly Points</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-racing-orange">
                {fan.weekly_points || 0}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Award className="h-4 w-4" />
                <span>Total Points</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-foundation-black">
                {fan.points || 0}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm md:col-span-1">
              <div className="text-sm text-gray-600">Rank</div>
              <p className="mt-1 text-2xl font-bold text-bright-teal">#1</p>
            </div>
          </div>

          {/* Why Featured Section */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              Why They Were Featured
            </h3>
            <p className="text-sm text-gray-600">
              {fan.weekly_points && fan.weekly_points > 0
                ? `Earned ${fan.weekly_points} points this week through active participation, making them the top contributor!`
                : 'Selected as this week\'s featured fan for their outstanding contributions to the community.'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/u/${fan.username}`}
          className="text-sm font-medium text-racing-orange hover:text-orange-700 transition-colors"
        >
          View {fan.username}'s Profile →
        </Link>
      </div>
    </div>
  )
}

