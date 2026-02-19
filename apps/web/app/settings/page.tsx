'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Save, Upload, X, LogOut, User, Bell, Info } from 'lucide-react'
import { NotificationSettings } from '@/components/notifications/notification-settings'

const TABS = ['profile', 'settings', 'info'] as const
type TabId = (typeof TABS)[number]

function isValidTab(t: string | null): t is TabId {
  return t === 'profile' || t === 'settings' || t === 'info'
}

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
  show_state_on_profile?: boolean | null
  show_age_on_profile?: boolean | null
  social_links: Record<string, string> | null
}

export default function SettingsPage() {
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
  const [doesShowStateOnProfile, setDoesShowStateOnProfile] = useState(false)
  const [doesShowAgeOnProfile, setDoesShowAgeOnProfile] = useState(false)
  const [socialLinks, setSocialLinks] = useState<Array<{ platform: string; url: string }>>([])
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabId>(isValidTab(tabFromUrl) ? tabFromUrl : 'profile')
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, unknown> | null>(null)
  const [notificationPrefsLoaded, setNotificationPrefsLoaded] = useState(false)

  // Sync activeTab from URL (e.g. /settings?tab=settings from notifications page)
  useEffect(() => {
    const t = searchParams.get('tab')
    if (isValidTab(t)) setActiveTab(t)
  }, [searchParams])

  useEffect(() => {
    loadProfile()
  }, [])

  // Fetch notification preferences when Settings tab is active
  useEffect(() => {
    if (activeTab !== 'settings') return
    if (notificationPrefsLoaded) return

    async function fetchPrefs() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      setNotificationPreferences(data ?? null)
      setNotificationPrefsLoaded(true)
    }
    fetchPrefs()
  }, [activeTab, notificationPrefsLoaded])

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
      setDoesShowStateOnProfile(data.show_state_on_profile !== false)
      setDoesShowAgeOnProfile(data.show_age_on_profile !== false)

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

    if (!formData.username.trim()) {
      setErrors({ username: 'Username is required' })
      setIsSubmitting(false)
      return
    }

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

    const socialLinksObj: Record<string, string> = {}
    socialLinks.forEach((link) => {
      if (link.platform.trim() && link.url.trim()) {
        socialLinksObj[link.platform.trim().toLowerCase()] = link.url.trim()
      }
    })

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
      show_age_on_profile: doesShowAgeOnProfile,
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

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
        </div>
      </div>
    )
  }

  function setTab(tab: TabId) {
    setActiveTab(tab)
    router.replace(`/settings?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-white">Settings</h1>
        <p className="mt-2 text-white/80">Manage your profile and account settings</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Tab nav: Profile, Settings, Info; Log out at bottom */}
        <nav className="flex flex-row flex-wrap gap-2 border-b border-white/20 pb-4 lg:flex-col lg:w-52 lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:border-white/20 lg:pr-6 lg:pb-0">
          {(
            [
              { id: 'profile' as const, label: 'Profile', icon: User },
              { id: 'settings' as const, label: 'Settings', icon: Bell },
              { id: 'info' as const, label: 'Info', icon: Info },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
          <div className="mt-auto hidden lg:block lg:pt-4" />
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors lg:mt-6"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Log out
          </button>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeTab === 'profile' && (
        <section className="rounded-lg border border-white/20 bg-white/5 p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-white/90">Profile Image</label>
              <div className="mt-2 flex items-center space-x-4">
                {profileImagePreview && (
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-white/20"
                  />
                )}
                <label className="flex cursor-pointer items-center space-x-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
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
              {errors.image && <p className="mt-1 text-sm text-red-400">{errors.image}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/90">
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 shadow-sm focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                required
              />
              {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white/90">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1 mb-6 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white shadow-sm focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] [color-scheme:dark]"
              />
              <div className="rounded-md border border-white/20 bg-white/5 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-[#25B4B1] focus:ring-[#25B4B1] focus:ring-offset-0"
                    checked={doesShowAgeOnProfile}
                    onChange={(e) => setDoesShowAgeOnProfile(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">Show my age on my profile</span>
                    <span className="block text-sm text-white/70">
                      If enabled, your age will be visible to other users on your public profile.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-white/90">
                  City <span className="text-white/50">(optional)</span>
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-white/90">
                  State <span className="text-white/50">(optional)</span>
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-white/90">
                  Country <span className="text-white/50">(optional)</span>
                </label>
                <input
                  type="text"
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                />
              </div>
            </div>

            {/* Privacy */}
            <div className="space-y-4">
              <div className="rounded-md border border-white/20 bg-white/5 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-[#25B4B1] focus:ring-[#25B4B1] focus:ring-offset-0"
                    checked={doesShowStateOnProfile}
                    onChange={(e) => setDoesShowStateOnProfile(e.target.checked)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">Show my state on my profile</span>
                    <span className="block text-sm text-white/70">
                      If enabled, your state may be visible to other users on your public profile.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-white/90">Social Links</label>
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="text-sm font-medium text-[#25B4B1] hover:text-[#3BEFEB] transition-colors"
                >
                  Add link
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
                      className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                    />
                    <input
                      type="url"
                      placeholder="URL"
                      value={link.url}
                      onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                      className="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="rounded-md p-2 text-white/60 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {errors.submit && (
              <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4">
                <p className="text-sm text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2 rounded-md bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </section>
          )}

          {activeTab === 'settings' && (
            <section className="rounded-lg border border-white/20 bg-white/5 p-6">
              <h2 className="mb-2 text-xl font-semibold text-white">Notifications</h2>
              <p className="mb-6 text-sm text-white/70">
                Manage how and when you receive notifications.
              </p>
              {notificationPrefsLoaded ? (
                <NotificationSettings initialPreferences={notificationPreferences} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
                </div>
              )}
            </section>
          )}

          {activeTab === 'info' && (
            <section className="rounded-lg border border-white/20 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Info</h2>
              <div className="space-y-3">
                <details className="rounded-lg border border-white/20 px-4 py-3 bg-white/5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">Terms of Service</summary>
                  <p className="mt-2 text-sm text-white/80">
                    Placeholder: Terms of Service content will appear here.
                  </p>
                </details>

                <details className="rounded-lg border border-white/20 px-4 py-3 bg-white/5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">Privacy Policy</summary>
                  <p className="mt-2 text-sm text-white/80">
                    Placeholder: Privacy Policy content will appear here.
                  </p>
                </details>

                <details className="rounded-lg border border-white/20 px-4 py-3 bg-white/5">
                  <summary className="cursor-pointer text-sm font-semibold text-white">Release Notes</summary>
                  <p className="mt-2 text-sm text-white/80">
                    Placeholder: Latest production deploy notes will appear here.
                  </p>
                </details>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
