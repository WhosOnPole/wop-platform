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
      const scrollThreshold = window.innerHeight * 0.6 // 60vh - full hero height
      const progress = scrollThreshold > 0 ? Math.min(scrollY / scrollThreshold, 1) : 0
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
