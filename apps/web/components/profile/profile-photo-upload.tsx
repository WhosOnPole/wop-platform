'use client'

import { useState, useRef } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Edit2, X } from 'lucide-react'
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
  const supabase = createClientComponentClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload image
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        alert('Failed to upload image')
        setIsUploading(false)
        setPreviewUrl(null)
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        alert('Failed to update profile')
      } else {
        // Refresh the page to show new image
        router.refresh()
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

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
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-300">
            <span className="text-4xl font-bold text-gray-600">?</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative h-32 w-32 flex-shrink-0" style={{ paddingLeft: '24px' }}>
      {previewUrl || profileImageUrl ? (
        <Image
          src={previewUrl || profileImageUrl!}
          alt="Profile"
          fill
          className="rounded-full object-cover"
          sizes="128px"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-300">
          <span className="text-4xl font-bold text-gray-600">?</span>
        </div>
      )}
      
      {/* Edit button overlay */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sunset-gradient border border-white/50 hover:shadow-lg hover:bg-sunset-gradient hover:border-0 transition-all disabled:opacity-50"
        aria-label="Edit profile photo"
      >
        {isUploading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Edit2 className="h-4 w-4" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  )
}
