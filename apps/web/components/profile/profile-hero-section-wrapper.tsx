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
  supabaseUrl?: string
  isFollowing?: boolean
  currentUserId?: string | null
}

export function ProfileHeroSectionWrapper({
  profile,
  isOwnProfile,
  teamBackground,
  supabaseUrl,
  isFollowing = false,
  currentUserId = null,
}: ProfileHeroSectionWrapperProps) {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.6 // 60vh - matches page hero + spacer
      const isMd = window.matchMedia('(min-width: 768px)').matches
      const contentStickyTop = (isMd ? 20 : 18) * 16 // below tab bar with clearance
      const scrollThreshold = Math.max(0, heroHeight - contentStickyTop - 8)
      const clampedScrollY = Math.min(scrollY, scrollThreshold)
      const progress = scrollThreshold > 0 ? Math.min(clampedScrollY / scrollThreshold, 1) : 0
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
      supabaseUrl={supabaseUrl}
      scrollProgress={scrollProgress}
      isFollowing={isFollowing}
      currentUserId={currentUserId}
    />
  )
}
