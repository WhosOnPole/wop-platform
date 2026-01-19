'use client'

import { useState, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface EntityTabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function EntityTabs({ tabs, defaultTab }: EntityTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  if (tabs.length === 0) return null

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  return (
    <div className="relative z-10 pt-8">
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden mb-6">
        <div className="flex w-full capitalize">
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              width={`${100 / tabs.length}%`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pb-8">
        {activeTabContent}
      </div>
    </div>
  )
}

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  width: string
}

function TabButton({ label, active, onClick, width }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm transition capitalize ${
        active
          ? 'bg-white bg-opacity-30 text-white shadow'
          : 'bg-[#1D1D1D] text-[#838383] hover:bg-white hover:bg-opacity-30'
      }`}
      style={{ width }}
    >
      {label}
    </button>
  )
}
