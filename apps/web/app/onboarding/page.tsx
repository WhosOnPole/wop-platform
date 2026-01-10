'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { OnboardingProfileStep } from '@/components/onboarding/profile-step'
import { OnboardingDriversStep } from '@/components/onboarding/drivers-step'
import { OnboardingTeamsStep } from '@/components/onboarding/teams-step'
import { OnboardingTracksStep } from '@/components/onboarding/tracks-step'
import { CheckCircle2, Circle } from 'lucide-react'

type OnboardingStep = 'profile' | 'drivers' | 'teams' | 'tracks' | 'complete'

export default function OnboardingPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('profile')
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const [shouldForceProfileStep, setShouldForceProfileStep] = useState(false)

  useEffect(() => {
    const provider = new URLSearchParams(window.location.search).get('provider')
    if (provider === 'tiktok' || provider === 'instagram') setShouldForceProfileStep(true)
    checkOnboardingStatus({ shouldForceProfileStep: provider === 'tiktok' || provider === 'instagram' })
  }, [])

  async function checkOnboardingStatus(args?: { shouldForceProfileStep?: boolean }) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Check if profile exists and has username (required for completion)
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (profile?.username) {
      // If a social provider prefilled username, still force the Profile step so the user can edit.
      if (args?.shouldForceProfileStep) {
        setLoading(false)
        setCurrentStep('profile')
        setProfileComplete(false)
        return
      }

      // Profile is complete, check if they need to complete onboarding
      // If they have a username, they've completed the required step
      setProfileComplete(true)
      // Check if they should skip to feed or continue onboarding
      const { data: grids } = await supabase
        .from('grids')
        .select('type')
        .eq('user_id', session.user.id)

      const hasAllGrids = grids?.some((g) => g.type === 'driver') &&
        grids?.some((g) => g.type === 'team') &&
        grids?.some((g) => g.type === 'track')

      if (hasAllGrids) {
        // All steps complete, redirect to feed
        router.push('/feed')
        return
      } else {
        // Profile complete but grids missing, start from drivers step
        setCurrentStep('drivers')
      }
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
      // Redirect to feed after a brief delay
      setTimeout(() => {
        router.push('/feed')
      }, 1500)
    }
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
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
    <div className="min-h-screen bg-gray-50">
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
                  <div className="flex flex-col items-center">
                    {isComplete || isPast ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-50">
                        <Circle className="h-6 w-6 text-blue-600" />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                        <Circle className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-blue-600' : isComplete || isPast ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                      {step.required && <span className="text-red-500">*</span>}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        isPast || isComplete ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          {currentStep === 'profile' && (
            <OnboardingProfileStep onComplete={handleProfileComplete} />
          )}
          {currentStep === 'drivers' && (
            <OnboardingDriversStep
              onComplete={() => handleStepComplete('drivers')}
              onSkip={() => handleSkip('drivers')}
            />
          )}
          {currentStep === 'teams' && (
            <OnboardingTeamsStep
              onComplete={() => handleStepComplete('teams')}
              onSkip={() => handleSkip('teams')}
            />
          )}
          {currentStep === 'tracks' && (
            <OnboardingTracksStep
              onComplete={() => handleStepComplete('tracks')}
              onSkip={() => handleSkip('tracks')}
            />
          )}
          {currentStep === 'complete' && (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome to Who's on Pole!</h2>
              <p className="mt-2 text-gray-600">Redirecting to your feed...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

