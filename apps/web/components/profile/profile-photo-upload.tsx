'use client'

import Image from 'next/image'

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

  if (!isOwnProfile) {
    // Just display the photo for other users
    return (
      <div className="relative h-32 w-32 flex-shrink-0" style={{ paddingLeft: '24px' }}>
        {profileImageUrl ? (
          <Image
            src={profileImageUrl}
            alt="Profile"
            fill
            className="rounded-full object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gray-300">
            <span className="text-4xl font-bold text-gray-600">?</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-36 w-36 flex-shrink-0">
      {profileImageUrl ? (
        <Image
          src={profileImageUrl}
          alt="Profile"
          fill
          className="rounded-full object-cover"
          sizes="128px"
        />
      ) : (
        <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
          <Image src="/images/seal_color.png" alt="Profile" fill className="object-cover" sizes="144px" />
        </div>
      )}
    </div>
  )
}
