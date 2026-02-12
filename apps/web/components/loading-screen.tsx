'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

const MIN_DISPLAY_MS = 1200
const FADE_DURATION_MS = 500
const NAV_SHOW_DELAY_MS = 500
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

  // Initial load: show until window load + min display, then fade
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

    function handleLoad() {
      readyToFadeRef.current = true
      if (minTimeElapsedRef.current) startFade()
    }

    if (typeof window === 'undefined') return

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
    }

    return () => {
      clearTimeout(minTimer)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      window.removeEventListener('load', handleLoad)
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
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-500 ease-out ${
        isFading && !showNavOverlay ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex h-28 w-28 flex-shrink-0 overflow-hidden rounded-full sm:h-36 sm:w-36">
        <div
          className="absolute left-1/2 top-1/2 z-0 h-[200%] w-[170%] min-h-[170%] min-w-[170%] -translate-x-1/2 -translate-y-1/2 animate-slot-border-rotate"
          style={{
            background:
              'linear-gradient(90deg, #EC6D00 0%, #FF006F 60%, #25B4B1 70%, #FF006F 80%, #EC6D00 100%)',
          }}
        />
        <div className="absolute inset-[2.5px] z-10 flex min-h-0 items-center justify-center overflow-hidden rounded-full bg-black">
          <img
            src="/images/seal_white.png"
            alt=""
            className="h-20 w-20 object-contain sm:h-28 sm:w-28"
            width={128}
            height={128}
          />
        </div>
      </div>
      <p className=" absolute bottom-[35vh] font-display text-white text-sm w-full text-center">Loading...</p>
    </div>
  )
}
