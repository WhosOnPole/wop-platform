'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Heart } from 'lucide-react'

interface GridHeartButtonProps {
  gridId: string
  initialLikeCount?: number
  initialIsLiked?: boolean
}

export function GridHeartButton({
  gridId,
  initialLikeCount = 0,
  initialIsLiked = false,
}: GridHeartButtonProps) {
  const supabase = createClientComponentClient()
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  async function toggleLike() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return
    }

    setIsLoading(true)

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('grid_likes')
        .delete()
        .eq('grid_id', gridId)
        .eq('user_id', session.user.id)

      if (!error) {
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      }
    } else {
      // Like
      const { error } = await supabase.from('grid_likes').insert({
        grid_id: gridId,
        user_id: session.user.id,
      })

      if (!error) {
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    }

    setIsLoading(false)
  }

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 align-middle rounded-full px-3 py-1.5 text-sm leading-none transition-colors ${
        isLiked
          ? 'text-sunset-start hover:opacity-90'
          : 'text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isLiked ? 'Unlike this grid' : 'Like this grid'}
    >
      <Heart className={`h-4 w-4 shrink-0 ${isLiked ? 'fill-current' : ''}`} />
      <span className="leading-none">{likeCount}</span>
    </button>
  )
}

