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
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 px-4 pt-[calc(3.75rem+env(safe-area-inset-top))] pb-4 overflow-y-auto">
      <div className="max-h-[calc(100vh-6rem)] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-sm text-white">
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
        <DiscussionSection
          posts={discussionPosts}
          parentPageType="poll"
          parentPageId={poll.id}
          variant="dark"
          compact
        />
      </div>
    </div>
  )
}
