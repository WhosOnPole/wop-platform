'use client'

import { useRouter } from 'next/navigation'
import { PollCard } from './poll-card'
import { DiscussionSection } from '@/components/dtt/discussion-section'

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium?: boolean
  created_at: string
  ends_at?: string | null
}

interface PollDiscussionModalProps {
  poll: Poll
  userResponse: string | undefined
  voteCounts: Record<string, number>
  discussionPosts: any[]
  onClose: () => void
  onVote?: () => void
}

export function PollDiscussionModal({
  poll,
  userResponse,
  voteCounts,
  discussionPosts,
  onClose,
  onVote,
}: PollDiscussionModalProps) {
  const router = useRouter()

  function handleVote(_pollId: string, _optionId: string) {
    router.refresh()
    onVote?.()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/80 px-4 pb-4">
      <div className="mb-2 mt-[calc(4rem+env(safe-area-inset-top))] flex max-h-[calc(100dvh-5rem)] w-full max-w-4xl flex-col overflow-y-auto rounded-lg border border-white/10 bg-black/90 text-white shadow-2xl backdrop-blur-sm">
        <div className="shrink-0 p-6 pb-0">
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md text-md font-black text-sunset-end transition-colors hover:bg-white/10"
            >
              X
            </button>
          </div>
          <div className="mb-6">
            <PollCard
              poll={{
                ...poll,
                is_featured_podium: poll.is_featured_podium ?? false,
              }}
              userResponse={userResponse}
              voteCounts={voteCounts}
              onVote={handleVote}
              variant="dark"
              className="min-h-0 border-0 bg-transparent p-0 shadow-none"
              showRepost={false}
              showFeaturedChip={false}
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
          <DiscussionSection
            posts={discussionPosts}
            parentPageType="poll"
            parentPageId={poll.id}
            variant="dark"
            compact
            fixedInput
          />
        </div>
      </div>
    </div>
  )
}
