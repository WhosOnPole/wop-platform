'use client'

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
    <div className="sticky top-[14rem] z-30 bg-black transition-colors duration-300 md:top-[16rem] px-4 pt-4">
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden">
        <div className="flex w-full">
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={() => onTabChange(tab.key)}
              showDivider={index < tabs.length - 1}
            />
          ))}
        </div>
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

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  showDivider?: boolean
}

function TabButton({ label, active, onClick, showDivider = false }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-xs tracking-wide transition w-1/4 uppercase bg-white hover:text-white flex items-center justify-center ${
        active ? 'text-white bg-opacity-30' : ' text-[#FFFFFF50] bg-opacity-[19%]'
      }`}
    >
      {label}
      {showDivider ? (
        <span className="pointer-events-none absolute right-0 top-1 bottom-1 w-[.5px] bg-white/20" />
      ) : null}
    </button>
  )
}
