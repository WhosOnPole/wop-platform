'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
      className={`flex items-center space-x-1 rounded-full px-3 py-1.5 text-sm transition-colors ${
        isLiked
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isLiked ? 'Unlike this grid' : 'Like this grid'}
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likeCount}</span>
    </button>
  )
}

