'use client'

import { useState, useEffect, useRef } from 'react'
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
  followerCount?: number
  followingCount?: number
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
  followerCount = 0,
  followingCount = 0,
  supabaseUrl,
}: ProfilePageClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('drivers')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isSticky, setIsSticky] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  // Scroll tracking with clamp-to-threshold behavior
  useEffect(() => {
    let isAdjustingScroll = false

    function handleScroll() {
      if (isAdjustingScroll) return

      const heroHeight = window.innerHeight * 0.6 // 60vh - matches page hero + spacer
      const isMd = window.matchMedia('(min-width: 768px)').matches
      // Content area starts below tab bar with extra clearance to avoid clipping
      const contentStickyTop = (isMd ? 20 : 18) * 16
      // Stop window scroll when content reaches this position; then scroll inner content
      const scrollThreshold = Math.max(0, heroHeight - contentStickyTop - 8)
      if (scrollThreshold <= 0) return

      const scrollY = window.scrollY
      const contentEl = contentRef.current

      // Clamp window scroll to the sticky threshold and transfer extra scroll
      // into the tab content container once sticky begins.
      if (contentEl) {
        // Scrolling down past the threshold: keep window pinned and scroll inner content instead.
        if (scrollY > scrollThreshold) {
          const overflow = scrollY - scrollThreshold
          isAdjustingScroll = true
          window.scrollTo({ top: scrollThreshold, behavior: 'auto' })
          contentEl.scrollTop = contentEl.scrollTop + overflow
          requestAnimationFrame(() => {
            isAdjustingScroll = false
          })
          return
        }

        // Scrolling up while inner content still has scroll: consume the scroll by
        // moving inner content back to top before letting the window scroll up.
        if (scrollY < scrollThreshold && contentEl.scrollTop > 0) {
          const needed = scrollThreshold - scrollY
          const prevTop = contentEl.scrollTop
          const nextTop = Math.max(0, prevTop - needed)
          const consumed = prevTop - nextTop
          contentEl.scrollTop = nextTop

          if (consumed > 0) {
            const remaining = needed - consumed
            isAdjustingScroll = true
            window.scrollTo({ top: scrollThreshold - remaining, behavior: 'auto' })
            requestAnimationFrame(() => {
              isAdjustingScroll = false
            })
          }
        }
      } else if (scrollY > scrollThreshold) {
        isAdjustingScroll = true
        window.scrollTo({ top: scrollThreshold, behavior: 'auto' })
        requestAnimationFrame(() => {
          isAdjustingScroll = false
        })
        return
      }

      const clampedScrollY = Math.min(window.scrollY, scrollThreshold)
      const progress = Math.min(clampedScrollY / scrollThreshold, 1)
      const sticky = clampedScrollY >= scrollThreshold || (contentRef.current?.scrollTop ?? 0) > 0

      setScrollProgress(progress)
      setIsSticky(sticky)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

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

  function scrollToComments() {
    const commentsSection = document.getElementById('profile-comments')
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isActivityTab = activeTab === 'activity'
  const driverGridDisplay = driverGrid ?? buildPlaceholderGrid('driver')
  const trackGridDisplay = trackGrid ?? buildPlaceholderGrid('track')
  const teamGridDisplay = teamGrid ?? buildPlaceholderGrid('team')

  return (
    <div className="relative min-h-screen z-10">
      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        teamBackground={teamBackground}
      />

      {/* Tab Content - Scrollable container when sticky */}
      <div 
        ref={contentRef} 
        className={`bg-black ${
          isSticky 
            ? `fixed left-0 right-0 bottom-0 z-20 top-[18rem] md:top-[20rem] ${
                isActivityTab ? 'overflow-y-hidden' : 'overflow-y-auto'
              }` 
            : 'px-4 py-6 sm:px-6 lg:px-8'
        }`}
      >
        <div className={isSticky ? 'px-4 pt-4 py-6 sm:px-6 lg:px-8 h-full min-h-0' : ''}>
          {/* Drivers tab */}
        {activeTab === 'drivers' && driverGridDisplay && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={driverGridDisplay}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
              onCommentClick={scrollToComments}
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
              onCommentClick={scrollToComments}
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
              onCommentClick={scrollToComments}
            />
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="mx-auto max-w-4xl h-full min-h-0">
            <ActivityTab
              activities={activities}
              profileUsername={profile.username}
              followerCount={followerCount}
              followingCount={followingCount}
            />
          </div>
        )}

        </div>
      </div>
    </div>
  )
}
