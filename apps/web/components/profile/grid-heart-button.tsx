'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Heart } from 'lucide-react'

interface GridHeartButtonProps {
  gridId: string
  initialLikeCount?: number
  initialIsLiked?: boolean
  /** 'dark' = hero/pill style (white on dark bg); default = light card style */
  variant?: 'default' | 'dark'
}

export function GridHeartButton({
  gridId,
  initialLikeCount = 0,
  initialIsLiked = false,
  variant = 'default',
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

  const isDark = variant === 'dark'
  const buttonClass = isDark
    ? `inline-flex items-center gap-1.5 rounded-full backdrop-blur-sm px-2 py-2 lg:px-3 text-sm font-medium hover:text-sunset-end transition-colors disabled:opacity-50 ${isLiked ? 'text-sunset-end' : 'text-white'}`
    : `inline-flex items-center gap-1 align-middle rounded-full px-3 py-1.5 text-sm leading-none transition-colors ${
        isLiked ? 'text-sunset-end hover:opacity-90' : 'text-white hover:text-sunset-end'
      } disabled:opacity-50`

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={buttonClass}
      title={isLiked ? 'Unlike this grid' : 'Like this grid'}
      aria-label={isLiked ? 'Unlike this grid' : 'Like this grid'}
    >
      {isLiked ? (
        <span className="heart-fill-sunset inline-block h-5 w-5 shrink-0" aria-hidden />
      ) : (
        <Heart className="h-5 w-5 shrink-0" />
      )}
      <span className={`leading-none ${isLiked ? 'text-sunset-end' : ''}`}>{likeCount}</span>
    </button>
  )
}

