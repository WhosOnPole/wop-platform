'use client'

import { useState, useEffect, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface EntityTabsProps {
  tabs: Tab[]
  defaultTab?: string
}

function getTabFromHash(): string | null {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash?.replace(/^#/, '')
  return hash || null
}

export function EntityTabs({ tabs, defaultTab }: EntityTabsProps) {
  const tabIds = tabs.map((t) => t.id)
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '')

  useEffect(() => {
    const hashTabId = getTabFromHash()
    if (hashTabId && tabIds.includes(hashTabId)) {
      setActiveTab(hashTabId)
    }
  }, [tabIds.join(',')])

  useEffect(() => {
    const handler = () => {
      const hashTabId = getTabFromHash()
      if (hashTabId && tabIds.includes(hashTabId)) {
        setActiveTab(hashTabId)
      }
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [tabIds.join(',')])

  function handleTabClick(tabId: string) {
    setActiveTab(tabId)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tabId}`)
    }
  }

  if (tabs.length === 0) return null

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  return (
    <div className="sticky top-[10vh] z-30 bg-black pt-8">
      <div className="flex items-center justify-between w-full rounded-full overflow-hidden mb-6">
        <div className="flex w-full capitalize">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              width={`${100 / tabs.length}%`}
            />
          ))}
        </div>
      </div>

      <div className="px-0 pb-8">
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
