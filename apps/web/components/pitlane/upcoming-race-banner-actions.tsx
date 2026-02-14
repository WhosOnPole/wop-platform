'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Heart } from 'lucide-react'
import Link from 'next/link'
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
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [chatCount, setChatCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Check initial like state and count, and chat count
  useEffect(() => {
    async function checkLikeState() {
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

      setLikeCount(likeCountResult || 0)

      // Get chat count - live chat messages if live, otherwise meetup posts
      if (isLive) {
        const { count: chatCountResult } = await supabase
          .from('live_chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackId)
          .is('deleted_at', null)

        setChatCount(chatCountResult || 0)
      } else {
        // Count meetup posts for this track
        const { count: meetupCount } = await supabase
          .from('track_tips')
          .select('*', { count: 'exact', head: true })
          .eq('track_id', trackId)
          .eq('type', 'meetups')
          .eq('status', 'approved')

        setChatCount(meetupCount || 0)
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

  // Determine chat link
  const chatHref = isLive ? `/race/${trackSlug}` : `/tracks/${trackSlug}#meetups`

  return (
    <div className="absolute top-2 right-2 flex items-center gap-3 z-20">
      {/* Chat Button with Count */}
      <Link
        href={chatHref}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5"
        aria-label={isLive ? 'Join live chat' : 'View meetups'}
      >
        <CommentIcon className="h-4 w-4 text-white" />
        <span className="text-white text-sm">{chatCount}</span>
      </Link>

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
