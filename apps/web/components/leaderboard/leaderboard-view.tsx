'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardViewProps {
  weeklyLeaderboard: Array<{
    rank: number
    points: number
    badge_type: string | null
    user: {
      id: string
      username: string
      profile_image_url: string | null
      points: number
    }
  }>
  monthlyLeaderboard: Array<{
    rank: number
    points: number
    badge_type: string | null
    user: {
      id: string
      username: string
      profile_image_url: string | null
      points: number
    }
  }>
  allTimeLeaderboard: Array<{
    id: string
    username: string
    profile_image_url: string | null
    points: number
  }>
}

export function LeaderboardView({
  weeklyLeaderboard,
  monthlyLeaderboard,
  allTimeLeaderboard,
}: LeaderboardViewProps) {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'all-time'>('weekly')

  function getBadgeIcon(rank: number, badgeType: string | null) {
    if (rank === 1 || badgeType === 'gold') {
      return <Trophy className="h-6 w-6 text-yellow-500" />
    }
    if (rank === 2 || badgeType === 'silver') {
      return <Medal className="h-6 w-6 text-gray-400" />
    }
    if (rank === 3 || badgeType === 'bronze') {
      return <Award className="h-6 w-6 text-orange-600" />
    }
    return null
  }

  function renderLeaderboard(
    items: any[],
    getPoints: (item: any) => number,
    getRank: (item: any, index: number) => number
  ) {
    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">No rankings available yet</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => {
          const rank = getRank(item, index)
          const points = getPoints(item)
          const user = item.user || item

          return (
            <Link
              key={user.id}
              href={`/u/${user.username}`}
              className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex w-12 items-center justify-center">
                {getBadgeIcon(rank, item.badge_type)}
                {!getBadgeIcon(rank, item.badge_type) && (
                  <span className="text-lg font-bold text-gray-600">#{rank}</span>
                )}
              </div>

              {user.profile_image_url ? (
                <Image
                  src={user.profile_image_url}
                  alt={user.username}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                  <span className="text-lg font-bold text-gray-600">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user.username}</p>
                <p className="text-sm text-gray-500">{points.toLocaleString()} points</p>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'weekly'
                ? 'border-racing-orange text-racing-orange'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'monthly'
                ? 'border-racing-orange text-racing-orange'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab('all-time')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'all-time'
                ? 'border-racing-orange text-racing-orange'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            All-Time
          </button>
        </nav>
      </div>

      {/* Leaderboard Content */}
      <div>
        {activeTab === 'weekly' &&
          renderLeaderboard(
            weeklyLeaderboard,
            (item) => item.points,
            (item, index) => item.rank || index + 1
          )}
        {activeTab === 'monthly' &&
          renderLeaderboard(
            monthlyLeaderboard,
            (item) => item.points,
            (item, index) => item.rank || index + 1
          )}
        {activeTab === 'all-time' &&
          renderLeaderboard(
            allTimeLeaderboard,
            (item) => item.points,
            (item, index) => index + 1
          )}
      </div>
    </div>
  )
}

