'use client'

import { useState } from 'react'

type TabKey = 'activity' | 'drivers' | 'tracks' | 'teams'

interface ProfileTabsProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  teamBackground?: string | null // For teams tab background
}

export function ProfileTabs({ activeTab, onTabChange, teamBackground }: ProfileTabsProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'activity', label: 'ACTIVITY' },
    { key: 'drivers', label: 'DRIVERS' },
    { key: 'tracks', label: 'TRACKS' },
    { key: 'teams', label: 'TEAMS' },
  ]

  return (
    <div className="sticky top-[14rem] z-30 bg-black transition-colors duration-300 md:top-[16rem]">
      <div className="flex w-full border-b border-white/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex-1 px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
              activeTab === tab.key
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Teams tab background - variable based on #1 team pick */}
      {activeTab === 'teams' && teamBackground && (
        <div
          className="absolute inset-0 -z-10 opacity-10"
          style={{
            background: `linear-gradient(135deg, var(--team-color-1), var(--team-color-2))`,
          }}
        />
      )}
    </div>
  )
}
