'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClientComponentClient } from '@/utils/supabase-client'
import { cropAvatarToBlob } from '@/utils/avatar-upload'
import { useRouter, useSearchParams } from 'next/navigation'
import { Save, LogOut, User, Bell, Info, Pencil, Clock, Check } from 'lucide-react'
import { DEFAULT_AVATAR_URL } from '@/utils/avatar'
import { getCountryFlagPath } from '@/utils/flags'

const TABS = ['profile', 'notifications', 'info'] as const
type TabId = (typeof TABS)[number]

function isValidTab(t: string | null): t is TabId {
  return t === 'profile' || t === 'notifications' || t === 'info'
}

interface Profile {
  id: string
  username: string
  email: string
  profile_image_url: string | null
  date_of_birth: string | null
  country: string | null
  show_country_on_profile?: boolean | null
  username_updated_at?: string | null
  instagram_username: string | null
  social_links?: Record<string, string> | null
}

const USERNAME_COOLDOWN_DAYS = 14
const COUNTRY_OPTIONS = [
  'Argentina',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahrain',
  'Belgium',
  'Brazil',
  'Canada',
  'China',
  'France',
  'Germany',
  'Hungary',
  'Italy',
  'Japan',
  'Mexico',
  'Monaco',
  'Netherlands',
  'Qatar',
  'Saudi Arabia',
  'Singapore',
  'Spain',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
] as const

/** Validates username without transforming. Allows letters (including capitals), numbers, underscores. */
function validateUsername(input: string): { valid: boolean; error?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { valid: false, error: 'Username is required' }
  if (/\s/.test(trimmed)) return { valid: false, error: 'Usernames cannot contain spaces.' }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only include letters, numbers, and underscores.' }
  }
  if (trimmed.length > 50) return { valid: false, error: 'Username must be 50 characters or less.' }
  return { valid: true }
}

function getUsernameCooldownInfo(usernameUpdatedAt?: string | null) {
  if (!usernameUpdatedAt) {
    return { canEdit: true, remainingMs: 0, nextAllowedAt: null as Date | null }
  }

  const updatedAt = new Date(usernameUpdatedAt)
  if (Number.isNaN(updatedAt.getTime())) {
    return { canEdit: true, remainingMs: 0, nextAllowedAt: null as Date | null }
  }

  const nextAllowedAt = new Date(updatedAt.getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
  const remainingMs = nextAllowedAt.getTime() - Date.now()
  return {
    canEdit: remainingMs <= 0,
    remainingMs: Math.max(0, remainingMs),
    nextAllowedAt,
  }
}

function formatRemainingDuration(ms: number) {
  const totalHours = Math.ceil(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  if (days <= 0) return `${hours}h remaining`
  if (hours === 0) return `${days}d remaining`
  return `${days}d ${hours}h remaining`
}

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    dateOfBirth: '',
    country: '',
    instagramUsername: '',
  })
  const [doesShowCountryOnProfile, setDoesShowCountryOnProfile] = useState(true)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [imageScale, setImageScale] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const t = searchParams.get('tab')
    if (t === 'settings') return 'profile' // backwards compat
    return isValidTab(t) ? t : 'profile'
  })

  // Sync activeTab from URL (e.g. /settings?tab=notifications). Default to profile when no tab specified.
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t === 'settings') setActiveTab('profile')
    else if (isValidTab(t)) setActiveTab(t)
    else setActiveTab('profile')
  }, [searchParams])

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
      const igFromSocial =
        data.social_links && typeof data.social_links === 'object' && data.social_links.instagram
        ? String(data.social_links.instagram).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').trim()
        : ''
      setFormData({
        username: data.username || '',
        dateOfBirth: data.date_of_birth || '',
        country: data.country || '',
        instagramUsername: data.instagram_username || igFromSocial || '',
      })
      setDoesShowCountryOnProfile(data.show_country_on_profile !== false)
      setProfileImagePreview(data.profile_image_url)
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

    const trimmedUsername = formData.username.trim()
    const usernameValidation = validateUsername(trimmedUsername)
    if (!usernameValidation.valid) {
      setErrors({ username: usernameValidation.error ?? 'Invalid username' })
      setIsSubmitting(false)
      return
    }

    const usernameCooldown = getUsernameCooldownInfo(profile?.username_updated_at)
    const usernameChanged = trimmedUsername !== (profile?.username || '')
    if (usernameChanged && !usernameCooldown.canEdit) {
      setErrors({ username: 'Username is on cooldown. Please wait before changing again.' })
      setIsSubmitting(false)
      return
    }

    if (usernameChanged) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .maybeSingle()

      if (existing) {
        setErrors({ username: 'Username already taken' })
        setIsSubmitting(false)
        return
      }
    }

    let imageUrl = profile?.profile_image_url || null

    if (profileImage && profileImagePreview) {
      const fileName = `${session.user.id}-${Date.now()}.jpg`
      const filePath = `profile-images/${fileName}`

      let imageBlob: Blob
      try {
        imageBlob = await cropAvatarToBlob(profileImagePreview, imageScale)
      } catch (error) {
        console.error('Error processing profile image:', error)
        setErrors({ image: 'Failed to process image' })
        setIsSubmitting(false)
        return
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, imageBlob, {
        upsert: true,
        contentType: 'image/jpeg',
      })

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

    const instagramUsername = formData.instagramUsername.replace(/^@/, '').trim() || null

    const dateOfBirthToSave = profile?.date_of_birth || formData.dateOfBirth || null

    const profileData = {
      id: session.user.id,
      username: trimmedUsername,
      email: session.user.email || '',
      profile_image_url: imageUrl,
      date_of_birth: dateOfBirthToSave,
      country: formData.country.trim() || null,
      show_country_on_profile: doesShowCountryOnProfile,
      instagram_username: instagramUsername,
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (error) {
      console.error('Error saving profile:', error)
      setErrors({ submit: 'Failed to save profile' })
    } else {
      setIsEditingUsername(false)
      router.push(`/u/${trimmedUsername}`)
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

  const usernameCooldown = getUsernameCooldownInfo(profile?.username_updated_at)
  const usernameValidation = validateUsername(formData.username.trim())
  const isUsernameValid = usernameValidation.valid
  const countryFlagPath = getCountryFlagPath(formData.country)
  const hasCustomProfileImage = Boolean(profileImagePreview?.trim())
  const isDateOfBirthLocked = Boolean(profile?.date_of_birth)
  const hasCountryInList = COUNTRY_OPTIONS.some((country) => country === formData.country)
  const dropdownCountryOptions =
    formData.country && !hasCountryInList
      ? [...COUNTRY_OPTIONS, formData.country]
      : [...COUNTRY_OPTIONS]

  function setTab(tab: TabId) {
    setActiveTab(tab)
    router.replace(`/settings?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-display text-white">Notifications</h1>
        <p className="mt-2 text-white/80">Manage your profile and notification preferences</p>
      </div>

      {/* Tab nav: Profile, Notifications, Info - pitlane style */}
      <div className="mb-6 flex w-full overflow-hidden rounded-full">
        <div className="flex w-full">
          {(
            [
              { id: 'notifications' as const, label: 'Notifications', icon: Bell },
              { id: 'profile' as const, label: 'Profile', icon: User },
              { id: 'info' as const, label: 'Info', icon: Info },
            ] as const
          ).map(({ id, label, icon: Icon }, index) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-xs tracking-wide uppercase transition ${
                activeTab === id
                  ? 'bg-white/30 text-white'
                  : 'bg-white/[19%] text-[#FFFFFF50] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {index < 2 && (
                <span
                  className={`pointer-events-none absolute right-0 top-1 bottom-1 w-[.5px] ${
                    activeTab === id ? 'bg-white/10' : 'bg-white/20'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-hidden">
          {activeTab === 'profile' && (
        <section className="rounded-lg border border-white/20 bg-white/5 p-6 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
            {/* Username */}
            <div className="rounded-md border border-white/20 bg-white/5 p-4">
              <p className="mb-1 text-sm font-medium text-white">Username *</p>
              <p className="mb-3 text-xs text-white/60">
                Username changes are limited to once every {USERNAME_COOLDOWN_DAYS} days.
              </p>

              <div className="flex items-center gap-3">
                {isEditingUsername ? (
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="h-10 min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 shadow-sm focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
                    required
                  />
                ) : (
                  <p className="min-w-0 flex-1 text-base font-medium text-white">@{formData.username}</p>
                )}
                <button
                  type="button"
                  disabled={
                    (!usernameCooldown.canEdit && !isEditingUsername) ||
                    (isEditingUsername && !isUsernameValid)
                  }
                  onClick={() => {
                    setIsEditingUsername((prev) => !prev)
                    setErrors((prev) => {
                      const next = { ...prev }
                      delete next.username
                      return next
                    })
                  }}
                  className="h-10 shrink-0 flex items-center justify-center rounded-md border border-white/10 bg-white/10 px-3 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isEditingUsername ? 'Done' : usernameCooldown.canEdit ? 'Edit' : 'Cooldown'}
                >
                  {isEditingUsername ? (
                    <Check className="h-4 w-4" />
                  ) : usernameCooldown.canEdit ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-white/70">
                {usernameCooldown.canEdit
                  ? 'Username is available to edit.'
                  : `Next change available ${usernameCooldown.nextAllowedAt?.toLocaleString() || ''} (${formatRemainingDuration(usernameCooldown.remainingMs)}).`}
              </p>
              {isEditingUsername && !isUsernameValid && (
                <p className="mt-1 text-sm text-red-400">{usernameValidation.error}</p>
              )}
              {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-white/90">Profile Image</label>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-center">
                <div className="relative">
                  {hasCustomProfileImage ? (
                    <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
                      <img
                        src={profileImagePreview || ''}
                        alt="Profile preview"
                        className="h-full w-full object-cover transition-transform duration-150"
                        style={{ transform: `scale(${imageScale})` }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/20 bg-white/10">
                      <img
                        src={DEFAULT_AVATAR_URL}
                        alt="Default profile"
                        className="h-16 w-16 object-contain opacity-90"
                      />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-[#25B4B1] text-white shadow-lg transition-colors hover:bg-[#25B4B1]/90">
                    <Pencil className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {hasCustomProfileImage ? (
                  <div className="w-full max-w-[12rem]">
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
                ) : (
                  <p className="text-sm text-white/70">
                    Upload a profile photo using the pencil icon.
                  </p>
                )}
              </div>
              {errors.image && <p className="mt-1 text-sm text-red-400">{errors.image}</p>}
            </div>

            {/* Date of Birth */}
            <div className="min-w-0">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-white/90">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                disabled={isDateOfBirthLocked}
                className="mt-1 block w-full min-w-0 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white shadow-sm focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1] disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
              />
              {isDateOfBirthLocked && (
                <p className="mt-1 text-xs text-white/60">
                  Date of birth can only be set once.
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-white/90">
                Country <span className="text-white/50">(optional)</span>
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              >
                <option value="" className="bg-[#1f1f1f] text-white/70">
                  Select a country
                </option>
                {dropdownCountryOptions.map((country) => (
                  <option key={country} value={country} className="bg-[#1f1f1f] text-white">
                    {country}
                  </option>
                ))}
              </select>
              {!countryFlagPath && formData.country && (
                <p className="mt-1 text-xs text-white/60">
                  No flag available for this country.
                </p>
              )}
            </div>

            {/* Privacy */}
            <div className="space-y-4">
              <div className="rounded-md border border-white/20 bg-white/5 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-[#25B4B1] focus:ring-[#25B4B1] focus:ring-offset-0"
                    checked={doesShowCountryOnProfile}
                    onChange={(e) => setDoesShowCountryOnProfile(e.target.checked)}
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-medium text-white">
                      {countryFlagPath ? (
                        <Image src={countryFlagPath} alt="Country flag" width={16} height={16} />
                      ) : null}
                      Show my country on my profile
                    </span>
                    <span className="block text-sm text-white/70">
                      If enabled, your country may be visible to other users on your public profile.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Instagram username */}
            <div className="min-w-0">
              <label htmlFor="instagramUsername" className="block text-sm font-medium text-white/90">
                Instagram username <span className="text-white/50">(optional)</span>
              </label>
              <input
                type="text"
                id="instagramUsername"
                placeholder="username"
                value={formData.instagramUsername}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    instagramUsername: e.target.value.replace(/^@/, ''),
                  })
                }
                className="mt-1 block w-full min-w-0 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none focus:ring-1 focus:ring-[#25B4B1]"
              />
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

          {activeTab === 'notifications' && (
            <section className="rounded-lg border border-white/20 bg-white/5 p-6">
              <h2 className="mb-6 text-2xl font-semibold text-white">Coming Soon!</h2>
              <p className="text-white/70">
                Notification preferences will be available here soon.
              </p>
            </section>
          )}

          {activeTab === 'info' && (
            <section className="rounded-lg border border-white/20 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Information</h2>
              <div className="space-y-3">
                <Link
                  href="/terms"
                  className="block rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Terms of Service
                </Link>

                <Link
                  href="/privacy"
                  className="block rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Privacy Policy
                </Link>

                <Link
                  href="/delete-data"
                  className="block rounded-lg border border-white/20 px-4 py-3 bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  How to Delete Your Data
                </Link>

                <p className="mt-6 text-sm text-white/60 leading-relaxed">
                  This platform is an independent, community-supported fan site and is not affiliated with, endorsed by, sponsored by, or officially connected to Formula 1®, any Formula 1 teams, drivers, sponsors, or affiliated organizations. All trademarks and related intellectual property are the property of their respective owners.
                </p>
              </div>
            </section>
          )}
      </div>

      {/* Log out - full-width red button at bottom */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Log out
      </button>
    </div>
  )
}
