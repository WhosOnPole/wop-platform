'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Pencil, Save } from 'lucide-react'

interface OnboardingProfileStepProps {
  onComplete: () => void
}

export function OnboardingProfileStep({ onComplete }: OnboardingProfileStepProps) {
  const supabase = createClientComponentClient()
  const [formData, setFormData] = useState({
    username: '',
    dateOfBirth: '',
  })
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [imageScale, setImageScale] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const maxDob = (() => {
    const today = new Date()
    today.setFullYear(today.getFullYear() - 13)
    return today.toISOString().split('T')[0]
  })()

  useEffect(() => {
    loadExistingData()
  }, [])

  function normalizeUsername(input: string) {
    return input
      .toLowerCase()
      .trim()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50)
  }

  async function loadExistingData() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, date_of_birth, profile_image_url')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile) {
      setFormData({
        username: profile.username || '',
        dateOfBirth: profile.date_of_birth || '',
      })
      setProfileImagePreview(profile.profile_image_url)
    }

    const userMeta = session.user.user_metadata as Record<string, unknown>
    const preferred =
      (typeof userMeta.preferred_username === 'string' && userMeta.preferred_username) ||
      (typeof userMeta.tiktok_display_name === 'string' && userMeta.tiktok_display_name) ||
      (typeof userMeta.user_name === 'string' && userMeta.user_name) ||
      (typeof userMeta.username === 'string' && userMeta.username) ||
      (typeof userMeta.full_name === 'string' && userMeta.full_name) ||
      (typeof userMeta.name === 'string' && userMeta.name) ||
      ''

    const normalized = preferred ? normalizeUsername(preferred) : ''
    if (!profile?.username && normalized) {
      setFormData((prev) => ({ ...prev, username: prev.username || normalized }))
    }
    setLoading(false)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      setImageScale(1)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function cropImageToBlob(dataUrl: string, zoom: number): Promise<Blob> {
    const size = 512
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No canvas context'))
          return
        }
        const w = img.naturalWidth
        const h = img.naturalHeight
        const coverScale = size / Math.min(w, h)
        const drawW = w * coverScale * zoom
        const drawH = h * coverScale * zoom
        const dx = (size - drawW) / 2
        const dy = (size - drawH) / 2
        ctx.drawImage(img, 0, 0, w, h, dx, dy, drawW, drawH)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
          'image/jpeg',
          0.92
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = dataUrl
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
      setIsSubmitting(false)
      return
    }

    if (!formData.dateOfBirth) {
      setErrors({ dateOfBirth: 'Date of birth is required' })
      setIsSubmitting(false)
      return
    }

    if (!agreeToPrivacy || !agreeToTerms) {
      setErrors({
        legal: 'You must agree to the Privacy Policy and Terms and Conditions to continue',
      })
      setIsSubmitting(false)
      return
    }

    const birthDate = new Date(formData.dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--

    if (Number.isNaN(age) || age < 13) {
      setErrors({ dateOfBirth: 'You must be at least 13 years old to use this service' })
      setIsSubmitting(false)
      return
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', formData.username.trim())
      .maybeSingle()

    if (existing && existing.id !== session.user.id) {
      setErrors({ username: 'Username already taken' })
      setIsSubmitting(false)
      return
    }

    let imageUrl = profileImagePreview

    if (profileImage && profileImagePreview) {
      try {
        const blob = await cropImageToBlob(profileImagePreview, imageScale)
        const fileName = `${session.user.id}-${Date.now()}.jpg`
        const filePath = `profile-images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          setErrors({ image: 'Failed to upload image' })
          setIsSubmitting(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath)
        imageUrl = publicUrl
      } catch (err) {
        console.error('Error cropping image:', err)
        setErrors({ image: 'Failed to process image' })
        setIsSubmitting(false)
        return
      }
    }

    const profileData = {
      id: session.user.id,
      username: formData.username.trim(),
      email: session.user.email || '',
      profile_image_url: imageUrl,
      date_of_birth: formData.dateOfBirth || null,
    }

    const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' })

    if (error) {
      console.error('Error saving profile:', error)
      setErrors({ submit: 'Failed to save profile' })
    } else {
      onComplete()
    }
    setIsSubmitting(false)
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] mb-8'
  const labelClass = 'block text-sm font-medium text-white/90 mb-2'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div>
        <h2 className="font-display text-2xl font-normal text-white">Set Up Your Profile</h2>
        <p className="mt-1 text-sm text-white/70">
          One step away from your journey!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Profile Image - left 1/3 */}
        <div className="flex flex-col items-center">
          <label className={labelClass}>Profile Picture</label>
          <div className="relative">
            {profileImagePreview ? (
              <div className="h-40 w-40 overflow-hidden rounded-full">
                <img
                  src={profileImagePreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover transition-transform duration-150"
                  style={{ transform: `scale(${imageScale})` }}
                />
              </div>
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-full bg-white/10">
                <span className="text-2xl text-white/40">+</span>
              </div>
            )}
            {/* Pencil button overlapping bottom-right of avatar circle */}
            <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-[#25B4B1] text-white shadow-lg hover:bg-[#25B4B1]/90 transition-colors">
              <Pencil className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          {profileImagePreview && (
            <div className="mt-3 w-full max-w-[10rem]">
              <p className="mb-1 text-xs text-white/70">Adjust zoom</p>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={imageScale}
                onChange={(e) => setImageScale(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#25B4B1] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#25B4B1] [&::-webkit-slider-thumb]:shadow"
              />
            </div>
          )}
          {errors.image && <p className="mt-1 text-sm text-red-400">{errors.image}</p>}
        </div>

        {/* Username + Date of Birth - right 2/3, stacked */}
        <div className="sm:col-span-2 flex flex-col">
          <div className="p-8 backdrop-blur-sm space-y-6">
            <div>
              <label htmlFor="username" className={labelClass}>
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={inputClass}
                placeholder="Choose a username"
              />
              {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className={labelClass}>
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                id="dateOfBirth"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={maxDob}
                className={inputClass}
              />
              {errors.dateOfBirth && <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth}</p>}
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/20 bg-white/5 text-[#25B4B1] focus:ring-[#25B4B1]"
                checked={agreeToPrivacy}
                onChange={(e) => setAgreeToPrivacy(e.target.checked)}
              />
              <span className="block pt-1 text-sm text-white/90">
                I agree to the{' '}
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-[#25B4B1] hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-white/20 bg-white/5 text-[#25B4B1] focus:ring-[#25B4B1]"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
              />
              <span className="block pt-1 text-sm text-white/90">
                I agree to the{' '}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-[#25B4B1] hover:underline">
                  Terms and Conditions
                </Link>
              </span>
            </label>
          </div>
        </div>
      </div>

      {errors.legal && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{errors.legal}</p>
        </div>
      )}

      {errors.submit && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{errors.submit}</p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isSubmitting || !agreeToPrivacy || !agreeToTerms}
          className="w-full max-w-md flex items-center justify-center gap-2 rounded-lg bg-[#25B4B1] px-6 py-3 text-sm font-medium text-white hover:bg-[#25B4B1]/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Hop In!</span>
        </button>
      </div>
    </form>
  )
}
