'use client'

import { useEffect, useState } from 'react'
import { ProfileHeroSection } from './profile-hero-section'

interface ProfileHeroSectionWrapperProps {
  profile: {
    id: string
    username: string
    profile_image_url: string | null
    city?: string | null
    state?: string | null
    age?: number | null
    show_state_on_profile?: boolean | null
  }
  isOwnProfile: boolean
  teamBackground?: string | null
  isFollowing?: boolean
  currentUserId?: string | null
}

export function ProfileHeroSectionWrapper({
  profile,
  isOwnProfile,
  teamBackground,
  isFollowing = false,
  currentUserId = null,
}: ProfileHeroSectionWrapperProps) {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const topNavHeight = 56 // pt-14 = 3.5rem = 56px
      const heroHeight = window.innerHeight * 0.6 // 60vh
      // Calculate when tabs become sticky - this is when content should stop scrolling
      const scrollThreshold = heroHeight - topNavHeight - 100 // Match profile-page-client calculation
      const progress = Math.min(scrollY / scrollThreshold, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <ProfileHeroSection
      profile={profile}
      isOwnProfile={isOwnProfile}
      teamBackground={teamBackground}
      scrollProgress={scrollProgress}
      isFollowing={isFollowing}
      currentUserId={currentUserId}
    />
  )
}
