'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { OnboardingProfileStep } from '@/components/onboarding/profile-step'

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  async function checkOnboardingStatus() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Onboarding is only for users missing required profile fields.
    // A completed profile requires: username + dob/age.
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, date_of_birth, age')
      .eq('id', session.user.id)
      .single()

    const isProfileComplete = Boolean(profile?.username && (profile?.date_of_birth || profile?.age))
    if (isProfileComplete) {
      router.push('/feed')
      return
    }

    setLoading(false)
  }

  async function handleProfileComplete() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    const username = profile?.username?.trim()
    if (username) {
      router.replace(`/u/${encodeURIComponent(username)}`)
    } else {
      router.replace('/feed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">Complete your profile</h1>
          <p className="mt-1 text-sm text-white/70">Add your details to get started.</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/40 p-8 backdrop-blur-sm">
          <OnboardingProfileStep onComplete={handleProfileComplete} />
        </div>
      </div>
    </div>
  )
}
