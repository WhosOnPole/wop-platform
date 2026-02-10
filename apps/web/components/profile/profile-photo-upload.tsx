'use client'

import Image from 'next/image'
import { getAvatarUrl } from '@/utils/avatar'

interface ProfilePhotoUploadProps {
  profileImageUrl: string | null
  isOwnProfile: boolean
  userId: string
}

export function ProfilePhotoUpload({
  profileImageUrl,
  isOwnProfile,
  userId,
}: ProfilePhotoUploadProps) {
  const avatarSrc = getAvatarUrl(profileImageUrl)

  if (!isOwnProfile) {
    return (
      <div className="relative h-32 w-32 flex-shrink-0" style={{ paddingLeft: '24px' }}>
        <Image
          src={avatarSrc}
          alt="Profile"
          fill
          className="rounded-full object-cover"
          sizes="128px"
        />
      </div>
    )
  }

  return (
    <div className="relative h-36 w-36 flex-shrink-0">
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
