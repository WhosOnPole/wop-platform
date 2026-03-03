'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const PULL_THRESHOLD = 80
const MAX_PULL = 120
const SCROLL_TOP_THRESHOLD = 10
const DEBOUNCE_MS = 2000

interface PullToRefreshFeedProps {
  children: React.ReactNode
  onRefresh: () => void
  enabled: boolean
}

export function PullToRefreshFeed({ children, onRefresh, enabled }: PullToRefreshFeedProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef(0)
  const lastRefreshRef = useRef(0)
  const isPullingRef = useRef(false)
  const pullDistanceRef = useRef(0)

  pullDistanceRef.current = pullDistance

  useEffect(() => {
    if (!enabled) return

    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY > SCROLL_TOP_THRESHOLD) return
      if (Date.now() - lastRefreshRef.current < DEBOUNCE_MS) return
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isPullingRef.current || window.scrollY > SCROLL_TOP_THRESHOLD) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        const dist = Math.min(delta, MAX_PULL)
        pullDistanceRef.current = dist
        setPullDistance(dist)
      }
    }

    function handleTouchEnd() {
      if (!isPullingRef.current) return
      const dist = pullDistanceRef.current
      if (dist > PULL_THRESHOLD) {
        lastRefreshRef.current = Date.now()
        setIsRefreshing(true)
        onRefresh()
        setTimeout(() => setIsRefreshing(false), 500)
      }
      setPullDistance(0)
      pullDistanceRef.current = 0
      isPullingRef.current = false
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, onRefresh])

  const showIndicator = pullDistance > 0 || isRefreshing
  const indicatorOpacity = showIndicator ? 1 : 0
  const readyToRelease = pullDistance >= PULL_THRESHOLD

  return (
    <div className="relative">
      {/* Pull indicator - fixed at top, slides down with pull */}
      <div
        className="pointer-events-none fixed left-0 right-0 top-18 z-40 flex h-12 items-center justify-center transition-opacity duration-150"
        style={{
          opacity: indicatorOpacity,
          transform: `translateY(${Math.max(0, pullDistance - 48)}px)`,
        }}
        aria-hidden
      >
        <div className="flex items-center gap-2 rounded-full bg-black/80 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : readyToRelease ? (
            <span>Release to refresh</span>
          ) : (
            <span>Pull to refresh</span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
