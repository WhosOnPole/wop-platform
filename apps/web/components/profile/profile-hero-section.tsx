import Link from 'next/link'
import { Settings } from 'lucide-react'
import { ProfilePhotoUpload } from './profile-photo-upload'
import { FollowButton } from './follow-button'
import { getTeamBackgroundGradient } from '@/utils/team-colors'
import { getTeamBackgroundUrl } from '@/utils/storage-urls'

interface ProfileHeroSectionProps {
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
  teamBackground?: string | null // Top team name for background (image or gradient)
  supabaseUrl?: string // When set with teamBackground, use team's background.jpg
  scrollProgress?: number // 0 to 1, for fade animations
  isFollowing?: boolean
  currentUserId?: string | null
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667EEA, #764BA2)'

export function ProfileHeroSection({
  profile,
  isOwnProfile,
  teamBackground,
  supabaseUrl,
  scrollProgress = 0,
  isFollowing = false,
  currentUserId = null,
}: ProfileHeroSectionProps) {
  // Use top team's background.jpg when available; otherwise gradient
  const useTeamBackgroundImage = Boolean(teamBackground && supabaseUrl)
  const backgroundImageUrl = useTeamBackgroundImage
    ? getTeamBackgroundUrl(teamBackground!, supabaseUrl!)
    : null
  const backgroundGradient = teamBackground
    ? getTeamBackgroundGradient(teamBackground)
    : DEFAULT_GRADIENT

  // Determine location display
  const showLocation = profile.show_state_on_profile !== false
  const locationParts: string[] = []
  if (profile.city) locationParts.push(profile.city)
  if (showLocation && profile.state) locationParts.push(profile.state)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null

  // Calculate scroll transform - content scrolls up limitedly
  const maxScroll = 90 // Maximum scroll distance in pixels
  const scrollOffset = Math.min(scrollProgress * maxScroll, maxScroll)

  return (
    <div className="relative w-full h-full">
      {/* Background: top team's background.jpg when available, else gradient */}
      {backgroundImageUrl ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: backgroundGradient }}
          aria-hidden
        />
      )}
      {/* Settings gear icon - only visible on own profile */}
      {isOwnProfile && (
        <Link
          href="/settings"
          className="absolute top-16 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors block md:hidden"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      )}

      {/* Scrollable content container */}
      <div
        className="relative z-10 h-full flex flex-col justify-end px-6 pt-8 pb-6"
        style={{
          transform: `translateY(-${scrollOffset}px)`,
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Profile Photo - fades out as scroll increases */}
        <div
          style={{
            opacity: Math.max(0, 1 - scrollProgress),
            transition: 'opacity 0.3s ease',
          }}
        >
          <ProfilePhotoUpload
            profileImageUrl={profile.profile_image_url}
            isOwnProfile={isOwnProfile}
            userId={profile.id}
          />
        </div>

        {/* Username - scrolls with content */}
        <h1 className="mt-4 text-4xl font-display tracking-wider text-white md:text-5xl lg:text-6xl">
          {profile.username}
        </h1>

        {/* Age + Location + Follow Button Row */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/90 md:text-base">
            {profile.age && showLocation && (
              <>
                <span>{profile.age}</span>
                <span>
                  •</span>
              </>
            )}
            {profile.age && !showLocation && <span>{profile.age} •</span>}
            {locationText && <span>{locationText}</span>}
          </div>

          {/* Follow Button - only show if not own profile */}
          {!isOwnProfile && currentUserId && (
            <FollowButton
              targetUserId={profile.id}
              isInitiallyFollowing={isFollowing}
            />
          )}
        </div>

        {/* Badges Section - TODO */}
        {/* TODO: Implement badge system to display user badges here */}
      </div>
    </div>
  )
}
