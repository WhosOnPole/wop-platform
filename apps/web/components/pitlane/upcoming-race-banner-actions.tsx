'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'

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
  const [isLoading, setIsLoading] = useState(false)

  // Check initial like state and count
  useEffect(() => {
    async function checkLikeState() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Check if user has liked this track
      const { data: userLike } = await supabase
        .from('votes')
        .select('id')
        .eq('target_id', trackId)
        .eq('target_type', 'track')
        .eq('user_id', session.user.id)
        .maybeSingle()

      setIsLiked(!!userLike)

      // Get like count (this would need to be stored somewhere - for now we'll use a simple count)
      // If tracks don't have a like_count field, we'll need to count votes
      const { count } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', trackId)
        .eq('target_type', 'track')

      setLikeCount(count || 0)
    }

    checkLikeState()
  }, [trackId, supabase])

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
    <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
      {/* Chat Button */}
      <Link
        href={chatHref}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label={isLive ? 'Join live chat' : 'View meetups'}
      >
        <MessageSquare className="h-4 w-4 text-white" />
      </Link>

      {/* Like Button */}
      <button
        onClick={toggleLike}
        disabled={isLoading}
        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
          isLiked
            ? 'bg-red-500/80 hover:bg-red-500'
            : 'bg-white/20 hover:bg-white/30'
        } disabled:opacity-50`}
        aria-label={isLiked ? 'Unlike this race' : 'Like this race'}
      >
        <Heart
          className={`h-4 w-4 ${isLiked ? 'fill-white text-white' : 'text-white'}`}
        />
      </button>
    </div>
  )
}
