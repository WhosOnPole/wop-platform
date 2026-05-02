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
    const commentId = searchParams.get('comment')
    if (!postId && !commentId) return

    function tryScroll() {
      const targetIds = [
        commentId ? `comment-${commentId}` : null,
        postId ? `post-${postId}` : null,
      ].filter(Boolean) as string[]
      for (const id of targetIds) {
        const el = document.getElementById(id)
        if (!el) continue
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        el.classList.add('ring-2', 'ring-[#25B4B1]', 'ring-offset-2', 'ring-offset-black')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-[#25B4B1]', 'ring-offset-2', 'ring-offset-black')
        }, 2200)
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
