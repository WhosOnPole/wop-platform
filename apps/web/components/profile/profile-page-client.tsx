'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProfileTabs } from './profile-tabs'
import { GridDisplayCard } from './grid-display-card'
import { ActivityTab } from './activity-tab'

type TabKey = 'drivers' | 'tracks' | 'teams' | 'activity'

const TAB_ORDER: TabKey[] = ['drivers', 'tracks', 'teams',  'activity']
const SWIPE_THRESHOLD = 50 // Minimum distance in pixels

interface ProfilePageClientProps {
  profile: any
  isOwnProfile: boolean
  teamBackground: string | null
  driverGrid?: any
  trackGrid?: any
  teamGrid?: any
  activities: any[]
  profilePosts: any[]
  supabaseUrl?: string
}

function buildPlaceholderGrid(gridType: 'driver' | 'team' | 'track') {
  return {
    id: `__placeholder__${gridType}`,
    type: gridType,
    ranked_items: [],
  }
}

export function ProfilePageClient({
  profile,
  isOwnProfile,
  teamBackground,
  driverGrid,
  trackGrid,
  teamGrid,
  activities,
  profilePosts,
  supabaseUrl,
}: ProfilePageClientProps) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>('drivers')
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  // Open tab from URL (e.g. ?tab=drivers from activity grid update link)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && TAB_ORDER.includes(tabParam as TabKey)) {
      setActiveTab(tabParam as TabKey)
    }
  }, [searchParams])

  // Mobile swipe gesture detection
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (!isMobile || !contentRef.current) return

    const content = contentRef.current

    function handleTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isSwipe.current = false
    }

    function handleTouchMove(e: TouchEvent) {
      if (!touchStartX.current || !touchStartY.current) return

      const touchX = e.touches[0].clientX
      const touchY = e.touches[0].clientY
      const deltaX = touchX - touchStartX.current
      const deltaY = touchY - touchStartY.current

      // Detect if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwipe.current = true
        // Prevent vertical scrolling during horizontal swipe
        e.preventDefault()
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!touchStartX.current || !touchStartY.current || !isSwipe.current) {
        touchStartX.current = 0
        touchStartY.current = 0
        return
      }

      const touchX = e.changedTouches[0].clientX
      const touchY = e.changedTouches[0].clientY
      const deltaX = touchX - touchStartX.current
      const deltaY = touchY - touchStartY.current
      const absDeltaX = Math.abs(deltaX)
      const absDeltaY = Math.abs(deltaY)

      // Check if swipe meets threshold and is primarily horizontal
      if (absDeltaX > SWIPE_THRESHOLD && absDeltaX > absDeltaY) {
        const currentIndex = TAB_ORDER.indexOf(activeTab)
        let newIndex: number

        if (deltaX > 0) {
          // Swipe right - previous tab
          newIndex = currentIndex === 0 ? TAB_ORDER.length - 1 : currentIndex - 1
        } else {
          // Swipe left - next tab
          newIndex = currentIndex === TAB_ORDER.length - 1 ? 0 : currentIndex + 1
        }

        setActiveTab(TAB_ORDER[newIndex])
      }

      touchStartX.current = 0
      touchStartY.current = 0
      isSwipe.current = false
    }

    content.addEventListener('touchstart', handleTouchStart, { passive: true })
    content.addEventListener('touchmove', handleTouchMove, { passive: false })
    content.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      content.removeEventListener('touchstart', handleTouchStart)
      content.removeEventListener('touchmove', handleTouchMove)
      content.removeEventListener('touchend', handleTouchEnd)
    }
  }, [activeTab])

  const driverGridDisplay = driverGrid ?? buildPlaceholderGrid('driver')
  const trackGridDisplay = trackGrid ?? buildPlaceholderGrid('track')
  const teamGridDisplay = teamGrid ?? buildPlaceholderGrid('team')

  return (
    <div className="relative z-10">
      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        teamBackground={teamBackground}
      />

      {/* Tab Content - in flow under tabs */}
      <div ref={contentRef} className="bg-black px-4 py-6 sm:px-6 lg:px-8">
        <div>
          {/* Drivers tab */}
        {activeTab === 'drivers' && driverGridDisplay && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={driverGridDisplay}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
            />
          </div>
        )}

        {/* Tracks tab */}
        {activeTab === 'tracks' && trackGridDisplay && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={trackGridDisplay}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
            />

          </div>
        )}

        {/* Teams tab */}
        {activeTab === 'teams' && teamGridDisplay && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={teamGridDisplay}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
            />
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="mx-auto max-w-4xl">
            <ActivityTab
              activities={activities}
              profileUsername={profile.username}
            />
          </div>
        )}

        </div>
      </div>
    </div>
  )
}
