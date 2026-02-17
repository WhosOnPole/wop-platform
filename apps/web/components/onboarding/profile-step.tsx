'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Save, Upload, X } from 'lucide-react'

interface OnboardingProfileStepProps {
  onComplete: () => void
}

export function OnboardingProfileStep({ onComplete }: OnboardingProfileStepProps) {
  const supabase = createClientComponentClient()
  const [formData, setFormData] = useState({
    username: '',
    dateOfBirth: '',
    city: '',
    state: '',
    country: '',
  })
  const [doesShowStateOnProfile, setDoesShowStateOnProfile] = useState(false)
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([])
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
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
      .replace(/['’]/g, '')
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
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile) {
      setFormData({
        username: profile.username || '',
        dateOfBirth: profile.date_of_birth || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
      })
      setDoesShowStateOnProfile(Boolean(profile.show_state_on_profile))
      setProfileImagePreview(profile.profile_image_url)
      if (profile.social_links && typeof profile.social_links === 'object') {
        setSocialLinks(
          Object.entries(profile.social_links as Record<string, string>).map(([platform, url]) => ({
            platform,
            url,
          }))
        )
      }
    }

    // If username isn't set in profile yet, prefill from social provider metadata.
    // TikTok: user_metadata.preferred_username (set during TikTok OAuth) or display_name.
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
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function addSocialLink() {
    setSocialLinks([...socialLinks, { platform: '', url: '' }])
  }

  function removeSocialLink(index: number) {
    setSocialLinks(socialLinks.filter((_, i) => i !== index))
  }

  function updateSocialLink(index: number, field: 'platform' | 'url', value: string) {
    const updated = [...socialLinks]
    updated[index][field] = value
    setSocialLinks(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    // Validate required fields and age >= 13
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

    // Check username uniqueness
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

    // Upload image if changed
    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profileImage, { upsert: true })

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
    }

    // Convert social links array to object
    const socialLinksObj: Record<string, string> = {}
    socialLinks.forEach((link) => {
      if (link.platform.trim() && link.url.trim()) {
        socialLinksObj[link.platform.trim().toLowerCase()] = link.url.trim()
      }
    })

    // Upsert profile
    const profileData = {
      id: session.user.id,
      username: formData.username.trim(),
      email: session.user.email || '',
      profile_image_url: imageUrl,
      date_of_birth: formData.dateOfBirth || null,
      age: age,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      country: formData.country.trim() || null,
      show_state_on_profile: doesShowStateOnProfile,
      social_links: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : null,
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
    'mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]'
  const labelClass = 'block text-sm font-medium text-white/90'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal text-white">Set Up Your Profile</h2>
        <p className="mt-1 text-sm text-white/70">
          Tell us about yourself. Username and date of birth are required.
        </p>
      </div>

      {/* Profile Image */}
      <div>
        <label className={labelClass}>Profile Picture</label>
        <div className="mt-2 flex items-center space-x-4">
          {profileImagePreview ? (
            <div className="relative">
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="h-24 w-24 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setProfileImage(null)
                  setProfileImagePreview(null)
                }}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <span className="text-2xl text-white/40">?</span>
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            <Upload className="mr-2 inline h-4 w-4" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        {errors.image && <p className="mt-1 text-sm text-red-400">{errors.image}</p>}
      </div>

      {/* Username */}
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

      {/* Date of Birth */}
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

      {/* Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="city" className={labelClass}>
            City <span className="text-white/50">(optional)</span>
          </label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className={inputClass}
            placeholder="City"
          />
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>
            State <span className="text-white/50">(optional)</span>
          </label>
          <input
            type="text"
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className={inputClass}
            placeholder="State"
          />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>
            Country <span className="text-white/50">(optional)</span>
          </label>
          <input
            type="text"
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className={inputClass}
            placeholder="Country"
          />
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#25B4B1] focus:ring-[#25B4B1]"
            checked={doesShowStateOnProfile}
            onChange={(e) => setDoesShowStateOnProfile(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium text-white">Show my state on my profile</span>
            <span className="block text-sm text-white/60">
              If enabled, your state may be visible to other users on your public profile.
            </span>
          </span>
        </label>
      </div>

      {/* Social Links */}
      <div>
        <label className={labelClass}>Social Links (Optional)</label>
        <div className="mt-2 space-y-2">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                placeholder="Platform (e.g., Twitter, Instagram)"
                value={link.platform}
                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="url"
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-red-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className="text-sm text-[#25B4B1] hover:text-[#25B4B1]/90"
          >
            + Add Social Link
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 rounded-lg bg-[#25B4B1] px-6 py-2 text-sm font-medium text-white hover:bg-[#25B4B1]/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Continue</span>
        </button>
      </div>
    </form>
  )
}

