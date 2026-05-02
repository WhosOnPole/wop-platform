'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
  activityPollsById?: Record<string, any>
  activityPollUserResponses?: Record<string, string>
  activityPollVoteCounts?: Record<string, Record<string, number>>
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
  activityPollsById = {},
  activityPollUserResponses = {},
  activityPollVoteCounts = {},
  profilePosts,
  supabaseUrl,
}: ProfilePageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const tabParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null
    return (tabParam && TAB_ORDER.includes(tabParam as TabKey)) ? (tabParam as TabKey) : 'drivers'
  })
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  // Open tab from URL (e.g. ?tab=drivers from activity grid update link; ?post=id / ?comment=id deep links)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const postParam = searchParams.get('post')
    const commentParam = searchParams.get('comment')
    if (postParam || commentParam) {
      setActiveTab('activity')
    } else if (tabParam && TAB_ORDER.includes(tabParam as TabKey)) {
      setActiveTab(tabParam as TabKey)
    }
  }, [searchParams])

  // Update URL when tab changes so back navigation restores tab state
  const handleTabChange = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      // Clear deep-link params so manual tab changes are not forced back to Activity.
      params.delete('post')
      params.delete('comment')
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  // Scroll to deep-linked activity targets and apply a temporary highlight.
  useEffect(() => {
    const postId = searchParams.get('post')
    const commentId = searchParams.get('comment')
    if ((!postId && !commentId) || activeTab !== 'activity') return

    const targetIds = [
      commentId ? `comment-${commentId}` : null,
      postId ? `post-${postId}` : null,
    ].filter(Boolean) as string[]

    let clearTimer: ReturnType<typeof setTimeout> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function focusTarget() {
      for (const id of targetIds) {
        const el = document.getElementById(id)
        if (!el) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        el.classList.add('ring-2', 'ring-[#25B4B1]', 'ring-offset-2', 'ring-offset-black')
        clearTimer = setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#25B4B1]', 'ring-offset-2', 'ring-offset-black')
        }, 2200)
        return true
      }
      return false
    }

    const initialTimer = setTimeout(() => {
      if (focusTarget()) return
      retryTimer = setTimeout(() => {
        focusTarget()
      }, 450)
    }, 300)

    return () => {
      clearTimeout(initialTimer)
      if (retryTimer) clearTimeout(retryTimer)
      if (clearTimer) clearTimeout(clearTimer)
    }
  }, [searchParams, activeTab])

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

        handleTabChange(TAB_ORDER[newIndex])
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
  }, [activeTab, handleTabChange])

  const driverGridDisplay = driverGrid ?? buildPlaceholderGrid('driver')
  const trackGridDisplay = trackGrid ?? buildPlaceholderGrid('track')
  const teamGridDisplay = teamGrid ?? buildPlaceholderGrid('team')

  return (
    <div className="relative z-10">
      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
              pollsById={activityPollsById}
              pollUserResponses={activityPollUserResponses}
              pollVoteCounts={activityPollVoteCounts}
            />
          </div>
        )}

        </div>
      </div>
    </div>
  )
}
