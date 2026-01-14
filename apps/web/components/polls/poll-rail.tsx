'use client'

import { useState } from 'react'
import { PollCard } from './poll-card'

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium: boolean
  created_at: string
}

interface PollRailProps {
  polls: Poll[]
  userResponses: Record<string, string>
  voteCounts: Record<string, Record<string, number>>
}

export function PollRail({
  polls: initialPolls,
  userResponses: initialUserResponses,
  voteCounts: initialVoteCounts,
}: PollRailProps) {
  const [polls] = useState(initialPolls)
  const [userResponses, setUserResponses] = useState(initialUserResponses)
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts)

  function handleVote(pollId: string, optionId: string) {
    setUserResponses({ ...userResponses, [pollId]: optionId })
    setVoteCounts({
      ...voteCounts,
      [pollId]: {
        ...(voteCounts[pollId] || {}),
        [optionId]: (voteCounts[pollId]?.[optionId] || 0) + 1,
      },
    })
  }

  if (polls.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No featured podiums yet.
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {polls.map((poll) => (
        <div key={poll.id} className="w-80 flex-shrink-0">
          <PollCard
            poll={poll}
            userResponse={userResponses[poll.id]}
            voteCounts={voteCounts[poll.id] || {}}
            onVote={handleVote}
            showDiscussion={false}
          />
        </div>
      ))}
    </div>
  )
}
