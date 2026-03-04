'use client'

import { getTeamBackgroundGradient } from '@/utils/team-colors'

interface ProfileStickyHeaderProps {
  username: string
  teamBackground?: string | null
  isVisible: boolean
}

export function ProfileStickyHeader({
  username,
  teamBackground,
  isVisible,
}: ProfileStickyHeaderProps) {
  const backgroundGradient = teamBackground
    ? getTeamBackgroundGradient(teamBackground)
    : 'linear-gradient(135deg, #667EEA, #764BA2)'

  return (
    <div
      className={`fixed top-[10vh] left-0 right-0 z-40 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
      style={{
        background: backgroundGradient,
      }}
    >
      <div className="px-6 py-3">
        <h1 className="text-2xl font-display tracking-wider text-white md:text-3xl">
          {username}
        </h1>
      </div>
    </div>
  )
}
