'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { Trophy, Repeat2 } from 'lucide-react'
import { useCreateModal } from '@/components/providers/create-modal-provider'

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium: boolean
  created_at: string
  ends_at?: string | null
}

interface PollCardProps {
  poll: Poll
  userResponse: string | undefined
  voteCounts: Record<string, number>
  onVote: (pollId: string, optionId: string) => void
  className?: string
  variant?: 'light' | 'dark'
  /** Smaller padding and text for embedded (e.g. repost) context */
  compact?: boolean
  /** Show Repost button; set false when embedded in a feed post */
  showRepost?: boolean
}

export function PollCard({
  poll,
  userResponse,
  voteCounts,
  onVote,
  className,
  variant = 'light',
  compact = false,
  showRepost = true,
}: PollCardProps) {
  const isDark = variant === 'dark'
  const supabase = createClientComponentClient()
  const router = useRouter()
  const createModal = useCreateModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localResponse, setLocalResponse] = useState(userResponse)

  function handleRepost() {
    createModal?.openPostModal({
      referencePollId: poll.id,
      referencePollQuestion: poll.question,
    })
  }

  // Calculate vote counts and percentages
  // Note: poll.options is a JSONB array of strings, not objects
  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0)
  
  const optionsWithStats = Array.isArray(poll.options)
    ? poll.options.map((opt, index) => {
        const optionId = String(index)
        const votes = voteCounts[optionId] || 0
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0
        return {
          text: opt,
          index: index,
          id: optionId,
          votes,
          percentage,
        }
      })
    : []

  async function handleVote(optionIndex: number) {
    if (localResponse) return // Already voted
    if (poll.ends_at && new Date(poll.ends_at) < new Date()) return // Poll ended

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsSubmitting(false)
      router.push('/login')
      return
    }

    // Use the index as the selected_option_id (since options are just strings in JSONB array)
    const selectedOptionId = String(optionIndex)

    const { error } = await supabase.from('poll_responses').insert({
      user_id: session.user.id,
      poll_id: poll.id,
      selected_option_id: selectedOptionId,
    })

    if (error) {
      const isDuplicate =
        error.code === '23505' ||
        /unique|duplicate/i.test(error.message ?? '')
      if (isDuplicate) {
        setLocalResponse(selectedOptionId)
        onVote(poll.id, selectedOptionId)
        router.refresh()
      } else {
        console.error('Error voting:', error)
        alert(`Failed to record vote: ${error.message}`)
      }
    } else {
      setLocalResponse(selectedOptionId)
      onVote(poll.id, selectedOptionId)
      router.refresh()
    }
    setIsSubmitting(false)
  }

  const hasVoted = !!localResponse
  const isExpired = !!poll.ends_at && new Date(poll.ends_at) < new Date()
  const showResults = hasVoted || isExpired

  return (
    <div
      className={`h-full w-full rounded-lg p-0 shadow ${
        isDark
          ? ' backdrop-blur-sm text-white'
          : 'border-gray-200 bg-white text-black'
      } ${className || ''}`}
    >
      <div className={compact ? 'mb-2 flex items-center justify-between gap-2' : 'mb-4 flex items-center justify-between gap-2'}>
        <h2 className={`min-w-0 flex-1 ${compact ? 'text-base font-medium' : 'text-xl font-semibold'} ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {poll.question}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {showResults && (
            <p className={`text-sm ${isDark ? 'text-white/90' : 'text-gray-600'}`}>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
            </p>
          )}
          {poll.is_featured_podium && !compact && (
            <div
              className="flex items-center space-x-1 rounded-full px-3 py-1 bg-sunset-gradient"
            >
              <Trophy className="h-4 w-4 " />
              <span className="text-xs font-medium">
                Featured
              </span>
            </div>
          )}
        </div>
      </div>

      {showResults ? (
        <div className={compact ? 'space-y-2' : 'space-y-3'}>
          {optionsWithStats.map((option) => {
            const isSelected = localResponse === option.id
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className={`font-medium ${
                      isDark
                        ? isSelected
                          ? 'text-[#EF771B]'
                          : 'text-white/20'
                        : isSelected
                          ? 'text-blue-600'
                          : 'text-gray-700'
                    }`}
                  >
                    {option.text}
                    {isSelected && ' ✓ (Your vote)'}
                  </span>
                  <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                    {option.votes} ({option.percentage}%)
                  </span>
                </div>
                <div
                  className={`h-2 overflow-hidden rounded-full ${
                    isDark ? 'bg-white/20' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`h-full transition-all ${
                      isDark
                        ? isSelected
                          ? 'bg-sunset-gradient'
                          : 'bg-white/40'
                        : isSelected
                          ? 'bg-blue-600'
                          : 'bg-gray-400'
                    }`}
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
          {optionsWithStats.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.index)}
              disabled={isSubmitting}
              className={
                isDark
                  ? `w-full rounded-md border border-white/20 bg-white/10 text-left text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`
                  : `w-full rounded-md border border-gray-300 bg-white text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`
              }
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {createModal && showRepost && (
        <div
          className={`border-t ${compact ? 'mt-2 pt-2' : 'mt-4 pt-4'} ${isDark ? 'border-white/10' : 'border-gray-200'}`}
        >
          <button
            type="button"
            onClick={handleRepost}
            className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
              isDark
                ? 'text-white/80 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Repeat2 className="h-4 w-4" />
            Repost
          </button>
        </div>
      )}
    </div>
  )
}

