import Link from 'next/link'
import Image from 'next/image'
import { Settings } from 'lucide-react'
import { ProfilePhotoUpload } from './profile-photo-upload'
import { FollowButton } from './follow-button'
import { getTeamBackgroundGradient } from '@/utils/team-colors'
import { getTeamBackgroundUrl } from '@/utils/storage-urls'
import { getCountryFlagPath } from '@/utils/flags'

interface ProfileHeroSectionProps {
  profile: {
    id: string
    username: string
    profile_image_url: string | null
    country?: string | null
    show_country_on_profile?: boolean | null
    instagram_username?: string | null
  }
  isOwnProfile: boolean
  teamBackground?: string | null // Top team name for background (image or gradient)
  supabaseUrl?: string // When set with teamBackground, use team's background.jpg
  scrollProgress?: number // 0 to 1, for fade animations
  isFollowing?: boolean
  currentUserId?: string | null
  followerCount?: number
  followingCount?: number
  profileUsername?: string
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
  followerCount = 0,
  followingCount = 0,
  profileUsername,
}: ProfileHeroSectionProps) {
  // Use top team's background.jpg when available; otherwise gradient
  const useTeamBackgroundImage = Boolean(teamBackground && supabaseUrl)
  const backgroundImageUrl = useTeamBackgroundImage
    ? getTeamBackgroundUrl(teamBackground!, supabaseUrl!)
    : null
  const backgroundGradient = teamBackground
    ? getTeamBackgroundGradient(teamBackground)
    : DEFAULT_GRADIENT

  // Respect visibility preferences
  const showCountry = profile.show_country_on_profile !== false
  const locationText = showCountry ? profile.country ?? null : null
  const countryFlagPath = locationText ? getCountryFlagPath(locationText) : null

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
          className="absolute top-16 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/5 hover:backdrop-blur-md transition-colors md:hidden"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      )}

      {/* Hero content - static, no extra scroll/parallax */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 pt-8 pb-6">
        {/* Profile Photo */}
        <div>
          <ProfilePhotoUpload
            profileImageUrl={profile.profile_image_url}
            isOwnProfile={isOwnProfile}
            userId={profile.id}
          />
        </div>

        {/* Username */}
        <h1 className="mt-4 text-4xl font-display tracking-wider text-white md:text-5xl lg:text-6xl">
          {profile.username}
        </h1>

        {/* Followers / Following - own line */}
        {profileUsername && (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90 md:text-base">
            <Link
              href={`/u/${profileUsername}/followers`}
              className="hover:text-white transition-colors"
            >
              <span className="font-semibold tabular-nums">{followerCount}</span>{' '}
              <span className="text-white/70">followers</span>
            </Link>
            <Link
              href={`/u/${profileUsername}/following`}
              className="hover:text-white transition-colors"
            >
              <span className="font-semibold tabular-nums">{followingCount}</span>{' '}
              <span className="text-white/70">following</span>
            </Link>
            {profile.instagram_username && (
              <a
                href={`https://instagram.com/${profile.instagram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* Location + Follow Button Row */}
        <div className="mt-1 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-sm text-white/90 md:text-base">
            {locationText ? (
              <span className="inline-flex items-center gap-2">
                {countryFlagPath ? (
                  <Image
                    src={countryFlagPath}
                    alt={locationText}
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                ) : null}
                <span>{locationText}</span>
              </span>
            ) : null}
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
