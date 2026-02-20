'use client'

import { useRouter } from 'next/navigation'
import { PollCard } from '@/components/polls/poll-card'

interface Poll {
  id: string
  question: string
  options?: unknown[]
  is_featured_podium?: boolean
  admin_id?: string | null
  created_at?: string
}

interface CommunityPollsSectionProps {
  polls: Poll[]
  userResponses: Record<string, string>
  voteCounts: Record<string, Record<string, number>>
}

export function CommunityPollsSection({
  polls,
  userResponses = {},
  voteCounts = {},
}: CommunityPollsSectionProps) {
  const router = useRouter()

  if (polls.length === 0) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Community polls</h2>
      <div className="flex flex-col gap-4">
        {polls.map((poll) => (
          <div
            key={poll.id}
            className="rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm"
          >
            <PollCard
              poll={{
                ...poll,
                options: Array.isArray(poll.options) ? poll.options : [],
                is_featured_podium: poll.is_featured_podium ?? false,
              }}
              userResponse={userResponses[poll.id]}
              voteCounts={voteCounts[poll.id] ?? {}}
              onVote={() => router.refresh()}
              variant="dark"
              className="min-h-0 border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
