'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { DiscussionSection } from '@/components/dtt/discussion-section'

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium: boolean
  created_at: string
}

interface PollCardProps {
  poll: Poll
  userResponse: string | undefined
  voteCounts: Record<string, number>
  onVote: (pollId: string, optionId: string) => void
}

export function PollCard({ poll, userResponse, voteCounts, onVote }: PollCardProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localResponse, setLocalResponse] = useState(userResponse)

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

    setIsSubmitting(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
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
      console.error('Error voting:', error)
      alert(`Failed to record vote: ${error.message}`)
    } else {
      setLocalResponse(selectedOptionId)
      onVote(poll.id, selectedOptionId)
      router.refresh() // Refresh to get updated vote counts
    }
    setIsSubmitting(false)
  }

  const hasVoted = !!localResponse

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{poll.question}</h2>
        {poll.is_featured_podium && (
          <div className="flex items-center space-x-1 rounded-full bg-yellow-100 px-3 py-1">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-800">Featured</span>
          </div>
        )}
      </div>

      {hasVoted ? (
        <div className="space-y-3">
          <p className="mb-4 text-sm text-gray-600">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </p>
          {optionsWithStats.map((option) => {
            const isSelected = localResponse === option.id
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                    {option.text}
                    {isSelected && ' ✓ (Your vote)'}
                  </span>
                  <span className="text-gray-600">
                    {option.votes} ({option.percentage}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${
                      isSelected ? 'bg-blue-600' : 'bg-gray-400'
                    }`}
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {optionsWithStats.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.index)}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-blue-500 disabled:opacity-50"
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {/* Discussion Section */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <DiscussionSection
          posts={[]}
          parentPageType="poll"
          parentPageId={poll.id}
        />
      </div>
    </div>
  )
}

