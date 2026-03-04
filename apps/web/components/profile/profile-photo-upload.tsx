'use client'

import Image from 'next/image'
import { getAvatarUrl, isDefaultAvatar } from '@/utils/avatar'

interface ProfilePhotoUploadProps {
  profileImageUrl: string | null
  isOwnProfile: boolean
  userId: string
}

const PROFILE_DEFAULT_STYLING =
  'relative h-36 w-36 flex-shrink-0 rounded-full border-2 border-white/20 bg-white/10'

export function ProfilePhotoUpload({
  profileImageUrl,
  isOwnProfile,
  userId,
}: ProfilePhotoUploadProps) {
  const avatarSrc = getAvatarUrl(profileImageUrl)
  const useDefault = isDefaultAvatar(profileImageUrl)

  if (!isOwnProfile) {
    return (
      <div
        className={
          useDefault
            ? PROFILE_DEFAULT_STYLING
            : 'relative h-32 w-32 flex-shrink-0'
        }
        style={!useDefault ? { paddingLeft: '24px' } : undefined}
      >
        <Image
          src={avatarSrc}
          alt="Profile"
          fill
          className="rounded-full object-cover"
          sizes={useDefault ? '144px' : '128px'}
        />
      </div>
    )
  }

  return (
    <div className={PROFILE_DEFAULT_STYLING}>
      <Image
        src={avatarSrc}
        alt="Profile"
        fill
        className="rounded-full object-cover"
        sizes="144px"
      />
    </div>
  )
}
