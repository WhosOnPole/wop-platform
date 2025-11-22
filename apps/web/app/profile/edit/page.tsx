'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Save, Upload, X } from 'lucide-react'

interface Profile {
  id: string
  username: string
  email: string
  profile_image_url: string | null
  date_of_birth: string | null
  age: number | null
  city: string | null
  state: string | null
  country: string | null
  social_links: Record<string, string> | null
}

export default function EditProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
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

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) {
      // If profile doesn't exist, redirect to onboarding
      if (error.code === 'PGRST116') {
        router.push('/onboarding')
        return
      }
      console.error('Error loading profile:', error)
      setLoading(false)
      return
    }

    if (data) {
      setProfile(data)
      setFormData({
        username: data.username || '',
        dateOfBirth: data.date_of_birth || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
      })

      // Convert social_links object to array
      if (data.social_links && typeof data.social_links === 'object') {
        setSocialLinks(
          Object.entries(data.social_links as Record<string, string>).map(([platform, url]) => ({
            platform,
            url,
          }))
        )
      }
      setProfileImagePreview(data.profile_image_url)
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

    if (!session) {
      router.push('/login')
      return
    }

    // Validate username
    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
      setIsSubmitting(false)
      return
    }

    // Check username uniqueness (if changed or new profile)
    if (formData.username !== profile?.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', formData.username.trim())
        .maybeSingle()

      if (existing) {
        setErrors({ username: 'Username already taken' })
        setIsSubmitting(false)
        return
      }
    }

    let imageUrl = profile?.profile_image_url || null

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

    // Upsert profile (create if doesn't exist, update if it does)
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

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (error) {
      console.error('Error saving profile:', error)
      setErrors({ submit: 'Failed to save profile' })
    } else {
      router.push(`/u/${formData.username.trim()}`)
    }
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Image</label>
          <div className="mt-2 flex items-center space-x-4">
            {profileImagePreview && (
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover"
              />
            )}
            <label className="flex cursor-pointer items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Upload className="h-4 w-4" />
              <span>Upload Image</span>
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
            Username *
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              id="state"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Social Links */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Social Links</label>
            <button
              type="button"
              onClick={addSocialLink}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Link
            </button>
          </div>
          <div className="space-y-2">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Platform (e.g., twitter)"
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="rounded-md p-2 text-gray-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {errors.submit && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    </div>
  )
}

