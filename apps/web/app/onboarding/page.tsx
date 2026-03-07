'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingProfileStep } from '@/components/onboarding/profile-step'

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  const forceProfileStep = searchParams.get('test') === '1' || searchParams.get('profile') === '1'

  useEffect(() => {
    checkOnboardingStatus()
  }, [forceProfileStep])

  async function checkOnboardingStatus() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Allow ?test=1 or ?profile=1 to force the profile step for testing
    if (forceProfileStep) {
      setLoading(false)
      return
    }

    // Onboarding is only for users missing required profile fields.
    // A completed profile requires: username + date_of_birth.
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, date_of_birth')
      .eq('id', session.user.id)
      .single()

    const isProfileComplete = Boolean(profile?.username && profile?.date_of_birth)
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
        <div className="backdrop-blur-sm">
          <OnboardingProfileStep onComplete={handleProfileComplete} />
        </div>
      </div>
    </div>
  )
}
