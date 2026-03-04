'use client'

import { useEffect, useState } from 'react'

interface FullscreenHandlerProps {
  autoRequest?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
}

export function FullscreenHandler({ autoRequest = false, onFullscreenChange }: FullscreenHandlerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Check initial fullscreen state
    const checkFullscreen = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
      onFullscreenChange?.(isCurrentlyFullscreen)
    }

    checkFullscreen()

    // Listen for fullscreen changes
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
    events.forEach((event) => {
      document.addEventListener(event, checkFullscreen)
    })

    return () => {
      window.removeEventListener('resize', checkMobile)
      events.forEach((event) => {
        document.removeEventListener(event, checkFullscreen)
      })
    }
  }, [onFullscreenChange])

  const requestFullscreen = async () => {
    if (!isMobile) return false

    try {
      const doc = document.documentElement as any

      if (doc.requestFullscreen) {
        await doc.requestFullscreen()
        return true
      } else if (doc.webkitRequestFullscreen) {
        // Safari
        await doc.webkitRequestFullscreen()
        return true
      } else if (doc.mozRequestFullScreen) {
        // Firefox
        await doc.mozRequestFullScreen()
        return true
      } else if (doc.msRequestFullscreen) {
        // IE/Edge
        await doc.msRequestFullscreen()
        return true
      }
    } catch (error) {
      console.warn('Fullscreen request failed:', error)
      return false
    }

    return false
  }

  const exitFullscreen = async () => {
    try {
      const doc = document as any

      if (doc.exitFullscreen) {
        await doc.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen()
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen()
      }
    } catch (error) {
      console.warn('Exit fullscreen failed:', error)
    }
  }

  // Auto-request fullscreen on mobile (requires user gesture, so we'll trigger on first interaction)
  useEffect(() => {
    if (!autoRequest || !isMobile || isFullscreen) return

    const handleFirstInteraction = () => {
      requestFullscreen()
      // Remove listeners after first attempt
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }

    // Try to request fullscreen on first user interaction
    document.addEventListener('touchstart', handleFirstInteraction, { once: true })
    document.addEventListener('click', handleFirstInteraction, { once: true })

    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
  }, [autoRequest, isMobile, isFullscreen])

  // Expose functions via window for manual control if needed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).requestFullscreen = requestFullscreen
      ;(window as any).exitFullscreen = exitFullscreen
    }
  }, [])

  return null
}
