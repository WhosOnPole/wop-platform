'use client'

import { useState } from 'react'
import { Trophy, Play } from 'lucide-react'

interface LeaderboardDashboardProps {
  weeklyLastGenerated: string | null | undefined
  monthlyLastGenerated: string | null | undefined
}

export function LeaderboardDashboard({
  weeklyLastGenerated,
  monthlyLastGenerated,
}: LeaderboardDashboardProps) {
  const [generating, setGenerating] = useState<'weekly' | 'monthly' | null>(null)

  async function handleGenerate(periodType: 'weekly' | 'monthly') {
    setGenerating(periodType)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-points-summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ period_type: periodType }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate leaderboard')
      }

      alert(`${periodType} leaderboard generated successfully!`)
      window.location.reload()
    } catch (error: any) {
      console.error('Failed to generate leaderboard:', error)
      alert(`Failed to generate: ${error.message}`)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">Weekly Leaderboard</h3>
            </div>
            {weeklyLastGenerated && (
              <p className="mt-2 text-sm text-gray-600">
                Last generated: {new Date(weeklyLastGenerated).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() => handleGenerate('weekly')}
            disabled={generating === 'weekly'}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{generating === 'weekly' ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Leaderboard</h3>
            </div>
            {monthlyLastGenerated && (
              <p className="mt-2 text-sm text-gray-600">
                Last generated: {new Date(monthlyLastGenerated).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() => handleGenerate('monthly')}
            disabled={generating === 'monthly'}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            <span>{generating === 'monthly' ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

