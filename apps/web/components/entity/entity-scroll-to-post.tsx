'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Scrolls to a specific post when ?post= is present in the URL.
 * Used for deep-linking from profile activity to entity discussion posts.
 * Retries a few times to handle tab content that may render after mount (e.g. tracks Meetups tab).
 */
export function EntityScrollToPost() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const postId = searchParams.get('post')
    if (!postId) return

    function tryScroll() {
      const el = document.getElementById(`post-${postId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        return true
      }
      return false
    }

    let t2: ReturnType<typeof setTimeout> | null = null
    const t1 = setTimeout(() => {
      if (tryScroll()) return
      t2 = setTimeout(() => tryScroll(), 400)
    }, 300)

    return () => {
      clearTimeout(t1)
      if (t2) clearTimeout(t2)
    }
  }, [searchParams])

  return null
}
