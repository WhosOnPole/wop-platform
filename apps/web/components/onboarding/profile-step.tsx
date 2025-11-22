'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([])
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExistingData()
  }, [])

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

    // Validate required fields
    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
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

    // Calculate age from date of birth
    let age = null
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Set Up Your Profile</h2>
        <p className="mt-1 text-sm text-gray-600">Tell us about yourself (all fields required)</p>
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
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
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <span className="text-2xl text-gray-400">?</span>
            </div>
          )}
          <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
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
        {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Choose a username"
        />
        {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="dateOfBirth"
          required
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="City"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="state"
            required
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="State"
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="country"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Country"
          />
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Social Links (Optional)</label>
        <div className="mt-2 space-y-2">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                placeholder="Platform (e.g., Twitter, Instagram)"
                value={link.platform}
                onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-red-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addSocialLink}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Social Link
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{errors.submit}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>Continue</span>
        </button>
      </div>
    </form>
  )
}

