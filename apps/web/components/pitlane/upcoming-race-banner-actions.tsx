'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Heart, Users } from 'lucide-react'
import { CommentIcon } from '@/components/ui/comment-icon'

interface UpcomingRaceBannerActionsProps {
  trackId: string
  trackSlug: string
  isLive: boolean
}

export function UpcomingRaceBannerActions({
  trackId,
  trackSlug,
  isLive,
}: UpcomingRaceBannerActionsProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Check initial like state and count, and chat count
  useEffect(() => {
    async function checkLikeState() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Check if user has liked this track (only if logged in)
        if (session) {
          const { data: userLike } = await supabase
            .from('votes')
            .select('id')
            .eq('target_id', trackId)
            .eq('target_type', 'track')
            .eq('user_id', session.user.id)
            .maybeSingle()

          setIsLiked(!!userLike)
        }

        // Get like count
        const { count: likeCountResult } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', trackId)
          .eq('target_type', 'track')

        setLikeCount(likeCountResult ?? 0)

        // When live: distinct users in chat (last 10 min). Otherwise: discussion posts count for Meetups tab.
        if (isLive) {
          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
          const { data: recentMessages } = await supabase
            .from('live_chat_messages')
            .select('user_id')
            .eq('track_id', trackId)
            .gte('created_at', tenMinutesAgo)
          const distinctUsers = recentMessages
            ? new Set(recentMessages.map((r: { user_id: string }) => r.user_id)).size
            : 0
          setChatCount(distinctUsers)
        } else {
          // Count discussion posts for this track = what the track page Meetups tab shows (DiscussionTab)
          const { count: postsCount, error } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('parent_page_type', 'track')
            .eq('parent_page_id', trackId)

          if (error) {
            console.warn('Pitlane banner: could not fetch meetups (posts) count', error.message)
            setChatCount(0)
          } else {
            setChatCount(postsCount ?? 0)
          }
        }
      } catch (e) {
        console.warn('Pitlane banner: checkLikeState failed', e)
        setChatCount(0)
      }
    }

    checkLikeState()

    // Refresh counts periodically if live
    if (isLive) {
      const interval = setInterval(checkLikeState, 10000) // Every 10 seconds
      return () => clearInterval(interval)
    }
  }, [trackId, supabase, isLive])

  async function toggleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Could redirect to login or show a toast
      return
    }

    setIsLoading(true)

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('target_id', trackId)
        .eq('target_type', 'track')
        .eq('user_id', session.user.id)

      if (!error) {
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      }
    } else {
      // Like
      const { error } = await supabase.from('votes').insert({
        user_id: session.user.id,
        target_id: trackId,
        target_type: 'track',
        value: 1,
      })

      if (!error) {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    }

    setIsLoading(false)
  }

  // Determine chat link (use button + router to avoid nested <a> inside parent Link)
  const chatHref = isLive ? `/race/${trackSlug}` : `/tracks/${trackSlug}#meetups`

  function handleChatClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(chatHref)
  }

  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
      {/* When live: user icon + people in chat count. Otherwise: comment icon + meetups count */}
      <button
        type="button"
        onClick={handleChatClick}
        className="flex min-w-[2.5rem] items-center justify-center gap-1.5 text-white hover:opacity-90"
        aria-label={isLive ? `${chatCount} people in chat` : `View meetups (${chatCount})`}
      >
        {isLive ? (
          <Users className="h-4 w-4 shrink-0 text-white" />
        ) : (
          <CommentIcon className="h-4 w-4 shrink-0 text-white" />
        )}
        <span className="text-right text-sm text-white" aria-hidden>{chatCount}</span>
      </button>

      {/* Like Button with Count */}
      {/* <button
        onClick={toggleLike}
        disabled={isLoading}
        className="flex items-center gap-1.5 disabled:opacity-50"
        aria-label={isLiked ? 'Unlike this race' : 'Like this race'}
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
        />
        <span className="text-white text-sm">{likeCount}</span>
      </button> */}
    </div>
  )
}
