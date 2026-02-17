'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { OnboardingProfileStep } from '@/components/onboarding/profile-step'
import { OnboardingGridStep } from '@/components/onboarding/grid-step'
import { CheckCircle2, Circle, ChevronLeft } from 'lucide-react'

type OnboardingStep = 'profile' | 'drivers' | 'teams' | 'tracks' | 'complete'

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const [isRedirectingToFeed, setIsRedirectingToFeed] = useState(false)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  useEffect(() => {
    if (currentStep !== 'complete') return

    setIsRedirectingToFeed(true)

    const softRedirect = setTimeout(() => {
      router.replace('/feed')
    }, 250)

    // Hard fallback: if Next navigation stalls, force a full page load
    const hardFallback = setTimeout(() => {
      window.location.href = '/feed'
    }, 4000)

    return () => {
      clearTimeout(softRedirect)
      clearTimeout(hardFallback)
    }
  }, [currentStep, router])

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

  function handleProfileComplete() {
    setProfileComplete(true)
    setCurrentStep('drivers')
  }

  function handleStepComplete(step: OnboardingStep) {
    if (step === 'drivers') {
      setCurrentStep('teams')
    } else if (step === 'teams') {
      setCurrentStep('tracks')
    } else if (step === 'tracks') {
      setCurrentStep('complete')
    }
  }

  function handleBack() {
    if (currentStep === 'drivers') setCurrentStep('profile')
    else if (currentStep === 'teams') setCurrentStep('drivers')
    else if (currentStep === 'tracks') setCurrentStep('teams')
    else if (currentStep === 'complete') setCurrentStep('tracks')
  }

  function canNavigateToStep(step: OnboardingStep) {
    if (step === 'profile') return true
    // profile step is required before any other steps
    if (!profileComplete) return false

    const order: OnboardingStep[] = ['profile', 'drivers', 'teams', 'tracks', 'complete']
    const currentIndex = order.indexOf(currentStep)
    const targetIndex = order.indexOf(step)
    return targetIndex <= currentIndex
  }

  function handleSkip(step: OnboardingStep) {
    if (step === 'drivers') {
      setCurrentStep('teams')
    } else if (step === 'teams') {
      setCurrentStep('tracks')
    } else if (step === 'tracks') {
      // Skip all grids, go to feed
      router.push('/feed')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  const steps = [
    { id: 'profile', label: 'Profile', required: true },
    { id: 'drivers', label: 'Top Drivers', required: false },
    { id: 'teams', label: 'Top Teams', required: false },
    { id: 'tracks', label: 'Top Tracks', required: false },
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepId = step.id as OnboardingStep
              const isActive = currentStep === stepId
              const isComplete =
                (stepId === 'profile' && profileComplete) ||
                (stepId === 'drivers' && currentStep === 'teams') ||
                (stepId === 'teams' && currentStep === 'tracks') ||
                (stepId === 'tracks' && currentStep === 'complete')
              const isPast = steps.findIndex((s) => s.id === currentStep) > index

              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (canNavigateToStep(stepId)) setCurrentStep(stepId)
                    }}
                    disabled={!canNavigateToStep(stepId)}
                    className="flex flex-col items-center disabled:cursor-not-allowed"
                    aria-label={`Go to ${step.label} step`}
                  >
                    {isComplete || isPast ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25B4B1]">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#25B4B1] bg-white/5">
                        <Circle className="h-6 w-6 text-[#25B4B1]" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-white/5">
                        <Circle className="h-6 w-6 text-white/40" />
                      </div>
                    )}
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-[#25B4B1]' : isComplete || isPast ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {step.label}
                      {step.required && <span className="text-red-400">*</span>}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        isPast || isComplete ? 'bg-[#25B4B1]' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-white/10 bg-black/40 p-8 backdrop-blur-sm">
          {currentStep !== 'profile' && (
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <span className="text-sm text-right text-white/50">You can always go back and adjust your selections.</span>
            </div>
          )}
          {currentStep === 'profile' && (
            <OnboardingProfileStep onComplete={handleProfileComplete} />
          )}
          {currentStep === 'drivers' && (
            <OnboardingGridStep
              type="driver"
              onComplete={() => handleStepComplete('drivers')}
              onSkip={() => handleSkip('drivers')}
            />
          )}
          {currentStep === 'teams' && (
            <OnboardingGridStep
              type="team"
              onComplete={() => handleStepComplete('teams')}
              onSkip={() => handleSkip('teams')}
            />
          )}
          {currentStep === 'tracks' && (
            <OnboardingGridStep
              type="track"
              onComplete={() => handleStepComplete('tracks')}
              onSkip={() => handleSkip('tracks')}
            />
          )}
          {currentStep === 'complete' && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-[#25B4B1]" />
              <h2 className="mt-4 font-display text-2xl text-white">Welcome to Who&apos;s on Pole!</h2>
              <p className="mt-2 text-white/70">
                {isRedirectingToFeed ? 'Redirecting to your feed…' : 'Finalizing…'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

