'use client'

import { useEffect, useState } from 'react'
import { X, Share2, Smartphone } from 'lucide-react'

interface AddToHomeScreenPromptProps {
  pathname: string | null
  isAuthenticated: boolean
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PromptMode = 'chrome' | 'ios' | null

const LANDING_KEY = 'a2hs-landing-dismissed'
const APP_KEY = 'a2hs-app-dismissed'

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const platform = navigator.platform ?? ''
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true || window.matchMedia('(display-mode: standalone)').matches
  )
}

export function AddToHomeScreenPrompt({
  pathname,
  isAuthenticated,
}: AddToHomeScreenPromptProps) {
  const [mode, setMode] = useState<PromptMode>(null)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const showOnLanding =
      pathname === '/' &&
      !isAuthenticated &&
      !localStorage.getItem(LANDING_KEY)

    const showOnApp =
      (pathname === '/feed' || pathname === '/onboarding') &&
      isAuthenticated &&
      !localStorage.getItem(APP_KEY)

    if (!showOnLanding && !showOnApp) return

    if (isStandalone()) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setMode('chrome')
      setIsVisible(true)
    }

    if ('onbeforeinstallprompt' in window) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }

    if (isIOS()) {
      setMode('ios')
      setIsVisible(true)
    }

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
    }
  }, [pathname, isAuthenticated])

  useEffect(() => {
    if (!isVisible) return

    const showOnLanding =
      pathname === '/' &&
      !isAuthenticated &&
      !localStorage.getItem(LANDING_KEY)

    const showOnApp =
      (pathname === '/feed' || pathname === '/onboarding') &&
      isAuthenticated &&
      !localStorage.getItem(APP_KEY)

    if (!showOnLanding && !showOnApp) {
      setIsVisible(false)
    }
  }, [pathname, isAuthenticated, isVisible])

  const dismiss = () => {
    if (pathname === '/' && !isAuthenticated) {
      localStorage.setItem(LANDING_KEY, '1')
    } else if (
      (pathname === '/feed' || pathname === '/onboarding') &&
      isAuthenticated
    ) {
      localStorage.setItem(APP_KEY, '1')
    }
    setIsVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt || mode !== 'chrome') return
    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      dismiss()
    } finally {
      setIsInstalling(false)
    }
  }

  if (!isVisible || !mode) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-[#1a1a1a] p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white">
                Add to Home Screen
              </h3>
              {mode === 'chrome' && (
                <p className="mt-1 text-xs text-white/70">
                  Install the app for quick access and a better experience.
                </p>
              )}
              {mode === 'ios' && (
                <p className="mt-1 text-xs text-white/70">
                  Tap <Share2 className="inline h-3 w-3" /> Share, then &quot;Add
                  to Home Screen&quot; to install.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {mode === 'chrome' && (
            <button
              type="button"
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {isInstalling ? 'Adding…' : 'Add to Home Screen'}
            </button>
          )}
          {mode === 'ios' && (
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
