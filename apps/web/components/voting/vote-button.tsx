'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'

interface VoteButtonProps {
  targetId: string
  targetType: 'post' | 'grid' | 'comment'
  initialVote: boolean
  initialCount: number
  ownerUserId?: string
}

export function VoteButton({
  targetId,
  targetType,
  initialVote,
  initialCount,
  ownerUserId,
}: VoteButtonProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isVoted, setIsVoted] = useState(initialVote)
  const [voteCount, setVoteCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  async function handleVote() {
    setIsLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    // Check if user is the owner
    if (ownerUserId && ownerUserId === session.user.id) {
      alert("You can't vote on your own content")
      setIsLoading(false)
      return
    }

    if (isVoted) {
      // Unvote
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', session.user.id)
        .eq('target_id', targetId)
        .eq('target_type', targetType)

      if (error) {
        console.error('Error removing vote:', error)
      } else {
        setIsVoted(false)
        setVoteCount((prev) => Math.max(0, prev - 1))
      }
    } else {
      // Vote
      const { error } = await supabase.from('votes').insert({
        user_id: session.user.id,
        target_id: targetId,
        target_type: targetType,
        value: 1,
      })

      if (error) {
        console.error('Error voting:', error)
        if (error.code === '23505') {
          // Unique constraint violation - already voted
          setIsVoted(true)
        }
      } else {
        setIsVoted(true)
        setVoteCount((prev) => prev + 1)
      }
    }
    setIsLoading(false)
  }

  return (
    <button
      onClick={handleVote}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 align-middle rounded-md px-2 py-1 text-sm leading-none transition-colors disabled:opacity-50 ${
        isVoted
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isVoted ? 'Remove vote' : 'Vote'}
    >
      <Heart className={`h-4 w-4 shrink-0 ${isVoted ? 'fill-current' : ''}`} />
      <span className="leading-none">{voteCount}</span>
    </button>
  )
}

