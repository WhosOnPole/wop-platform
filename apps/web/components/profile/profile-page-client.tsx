'use client'

import { useState, useEffect, useRef } from 'react'
import { ProfileTabs } from './profile-tabs'
import { GridDisplayCard } from './grid-display-card'
import { ActivityTab } from './activity-tab'
import { ProfileDiscussionSection } from './profile-discussion-section'

type TabKey = 'activity' | 'drivers' | 'tracks' | 'teams'

const TAB_ORDER: TabKey[] = ['activity', 'drivers', 'tracks', 'teams']
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
  const [activeTab, setActiveTab] = useState<TabKey>('activity')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isSticky, setIsSticky] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  // Scroll tracking
  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      // Calculate threshold: hero is 60vh, top nav is ~56px (pt-14)
      // Username is positioned at bottom of hero, so threshold is approximately 60vh - top nav height
      const topNavHeight = 56 // pt-14 = 3.5rem = 56px
      const heroHeight = window.innerHeight * 0.6 // 60vh
      // Username position is roughly at bottom of hero, so threshold is hero height minus some offset
      // Based on image, username appears around 20-25% from top, so threshold is approximately hero height - (hero height * 0.4)
      const scrollThreshold = heroHeight - topNavHeight - 100 // Adjust offset to match username position
      const progress = Math.min(scrollY / scrollThreshold, 1)
      const sticky = scrollY >= scrollThreshold

      setScrollProgress(progress)
      setIsSticky(sticky)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
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
            ? 'fixed top-[calc(14rem+3rem)] left-0 right-0 bottom-20 overflow-y-auto z-20 md:top-[calc(16rem+3rem)]' 
            : 'px-4 py-6 sm:px-6 lg:px-8'
        }`}
      >
        <div className={isSticky ? 'px-4 py-6 sm:px-6 lg:px-8' : ''}>
          {activeTab === 'activity' && (
          <div className="mx-auto max-w-4xl">
            <ActivityTab activities={activities} profileUsername={profile.username} />
          </div>
        )}

        {activeTab === 'drivers' && driverGrid && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={driverGrid}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
              onCommentClick={scrollToComments}
            />
            <div id="profile-comments" className="mt-8">
              <ProfileDiscussionSection
                posts={profilePosts}
                profileId={profile.id}
                profileUsername={profile.username}
              />
            </div>
          </div>
        )}

        {activeTab === 'tracks' && trackGrid && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={trackGrid}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
              onCommentClick={scrollToComments}
            />
            <div id="profile-comments" className="mt-8">
              <ProfileDiscussionSection
                posts={profilePosts}
                profileId={profile.id}
                profileUsername={profile.username}
              />
            </div>
          </div>
        )}

        {activeTab === 'teams' && teamGrid && (
          <div className="mx-auto max-w-4xl">
            <GridDisplayCard
              grid={teamGrid}
              isOwnProfile={isOwnProfile}
              supabaseUrl={supabaseUrl}
              onCommentClick={scrollToComments}
            />
            <div id="profile-comments" className="mt-8">
              <ProfileDiscussionSection
                posts={profilePosts}
                profileId={profile.id}
                profileUsername={profile.username}
              />
            </div>
          </div>
        )}

        {/* Empty states */}
        {activeTab === 'drivers' && !driverGrid && (
          <div className="mx-auto max-w-4xl py-12 text-center text-white">
            <p>No driver grid yet</p>
          </div>
        )}
        {activeTab === 'tracks' && !trackGrid && (
          <div className="mx-auto max-w-4xl py-12 text-center text-white">
            <p>No track grid yet</p>
          </div>
        )}
        {activeTab === 'teams' && !teamGrid && (
          <div className="mx-auto max-w-4xl py-12 text-center text-white">
            <p>No team grid yet</p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
