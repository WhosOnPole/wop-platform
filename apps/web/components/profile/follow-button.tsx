'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  isInitiallyFollowing: boolean
}

export function FollowButton({ targetUserId, isInitiallyFollowing }: FollowButtonProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing)
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggleFollow() {
    setIsLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', targetUserId)

      if (error) {
        console.error('Error unfollowing:', error)
      } else {
        setIsFollowing(false)
      }
    } else {
      // Follow
      const { error } = await supabase.from('follows').insert({
        follower_id: session.user.id,
        following_id: targetUserId,
      })

      if (error) {
        console.error('Error following:', error)
      } else {
        setIsFollowing(true)
      }
    }
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'border border-white/50 bg-transparent text-white hover:bg-white/10'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isFollowing ? (
        <UserCheck className="h-4 w-4" strokeWidth={2} />
      ) : (
        <>
          <span>+</span>
          <span>Follow</span>
        </>
      )}
    </button>
  )
}

