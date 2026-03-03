'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { LoadingLogo } from '@/components/loading-logo'

const MIN_DISPLAY_MS = 400
const FADE_DURATION_MS = 300
const NAV_SHOW_DELAY_MS = 300
const NAV_HIDE_SETTLE_MS = 150

function isSameOriginLink(target: Element | null): boolean {
  const anchor = target?.closest?.('a[href]')
  if (!anchor) return false
  const href = (anchor as HTMLAnchorElement).getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  if (href.startsWith('/')) return true
  try {
    return new URL(href, window.location.origin).origin === window.location.origin
  } catch {
    return false
  }
}

export function LoadingScreen() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const [showNavOverlay, setShowNavOverlay] = useState(false)
  const readyToFadeRef = useRef(false)
  const minTimeElapsedRef = useRef(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathnameRef = useRef<string | null>(null)

  // Initial load: show until DOM ready + min display, then fade
  // Use DOMContentLoaded (not 'load') so we don't wait for images/fonts - content appears faster
  useEffect(() => {
    function startFade() {
      if (!readyToFadeRef.current || !minTimeElapsedRef.current) return
      readyToFadeRef.current = false
      setIsFading(true)
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false)
        hideTimeoutRef.current = null
      }, FADE_DURATION_MS)
    }

    const minTimer = setTimeout(() => {
      minTimeElapsedRef.current = true
      if (readyToFadeRef.current) startFade()
    }, MIN_DISPLAY_MS)

    function handleReady() {
      readyToFadeRef.current = true
      if (minTimeElapsedRef.current) startFade()
    }

    if (typeof window === 'undefined') return

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleReady)
    } else {
      handleReady()
    }

    return () => {
      clearTimeout(minTimer)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      document.removeEventListener('DOMContentLoaded', handleReady)
    }
  }, [])

  // Navigation start: link click or popstate -> show overlay after delay if still loading
  useEffect(() => {
    if (typeof window === 'undefined') return

    function startNavTimer() {
      if (pendingNavTimeoutRef.current) clearTimeout(pendingNavTimeoutRef.current)
      pendingNavTimeoutRef.current = setTimeout(() => {
        pendingNavTimeoutRef.current = null
        setShowNavOverlay(true)
      }, NAV_SHOW_DELAY_MS)
    }

    function onClick(e: MouseEvent) {
      if (isSameOriginLink(e.target as Element)) startNavTimer()
    }

    function onPopState() {
      startNavTimer()
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)

    return () => {
      if (pendingNavTimeoutRef.current) clearTimeout(pendingNavTimeoutRef.current)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  // Navigation complete: pathname changed -> hide overlay after settle
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      if (pendingNavTimeoutRef.current) {
        clearTimeout(pendingNavTimeoutRef.current)
        pendingNavTimeoutRef.current = null
      }
      prevPathnameRef.current = pathname
      if (showNavOverlay) {
        if (hideNavTimeoutRef.current) clearTimeout(hideNavTimeoutRef.current)
        hideNavTimeoutRef.current = setTimeout(() => {
          hideNavTimeoutRef.current = null
          setShowNavOverlay(false)
        }, NAV_HIDE_SETTLE_MS)
      }
    }
    return () => {
      if (hideNavTimeoutRef.current) clearTimeout(hideNavTimeoutRef.current)
    }
  }, [pathname, showNavOverlay])

  const show = isVisible || showNavOverlay
  if (!show) return null

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ease-out p-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] ${
        isFading && !showNavOverlay ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <LoadingLogo />
    </div>
  )
}
