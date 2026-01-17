'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter } from 'next/navigation'
import { PollCard } from './poll-card'

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium: boolean
  created_at: string
}

interface PollListProps {
  polls: Poll[]
  userResponses: Record<string, string>
  voteCounts: Record<string, Record<string, number>>
}

export function PollList({
  polls: initialPolls,
  userResponses: initialUserResponses,
  voteCounts: initialVoteCounts,
}: PollListProps) {
  const [polls] = useState(initialPolls)
  const [userResponses, setUserResponses] = useState(initialUserResponses)
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts)

  function handleVote(pollId: string, optionId: string) {
    setUserResponses({ ...userResponses, [pollId]: optionId })
    // Update vote counts optimistically
    setVoteCounts({
      ...voteCounts,
      [pollId]: {
        ...(voteCounts[pollId] || {}),
        [optionId]: (voteCounts[pollId]?.[optionId] || 0) + 1,
      },
    })
  }

  return (
    <div className="space-y-6">
      {polls.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No polls available yet. Check back soon!</p>
        </div>
      ) : (
        polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            userResponse={userResponses[poll.id]}
            voteCounts={voteCounts[poll.id] || {}}
            onVote={handleVote}
          />
        ))
      )}
    </div>
  )
}

