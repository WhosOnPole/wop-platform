'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Heart, MessageSquare } from 'lucide-react'

interface FeaturedGridSocialProps {
  gridId: string
  initialLikeCount: number
}

export function FeaturedGridSocial({ gridId, initialLikeCount }: FeaturedGridSocialProps) {
  const supabase = createClientComponentClient()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function checkLiked() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      const { data } = await supabase
        .from('grid_likes')
        .select('id')
        .eq('grid_id', gridId)
        .eq('user_id', session.user.id)
        .maybeSingle()

      setIsLiked(!!data)
    }

    checkLiked()
  }, [gridId, supabase])

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
    <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
      <button
        onClick={toggleLike}
        disabled={isLoading}
        className={`flex items-center space-x-1 transition-colors ${
          isLiked
            ? 'text-pink-600 hover:text-pink-700'
            : 'text-pink-600 hover:text-pink-700'
        } disabled:opacity-50`}
      >
        <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
        {likeCount > 0 && <span className="text-sm font-medium">{likeCount}</span>}
      </button>
      <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 transition-colors">
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm font-medium">0</span>
      </button>
    </div>
  )
}

