'use client'

import { useState } from 'react'
import { Radio, Check } from 'lucide-react'
import { DiscussionSection } from '@/components/dtt/discussion-section'
import { PollDiscussionModal } from '@/components/polls/poll-discussion-modal'
import { FeaturedNewsCard } from './featured-news-card'
import { FeaturedGridPostBlock, type FeaturedGridForBlock } from './featured-grid-post-block'

interface SpotlightHotTake {
  id: string
  content_text: string
}

interface SpotlightData {
  hot_take: SpotlightHotTake | null
}

interface FeaturedGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment?: string | null
  blurb?: string | null
  ranked_items: Array<{ id?: string; name?: string; title?: string; headshot_url?: string | null; image_url?: string | null; location?: string | null; country?: string | null; circuit_ref?: string | null }>
  user: { id: string; username: string; profile_image_url: string | null } | null
  updated_at?: string | null
  created_at?: string | null
  like_count?: number
  comment_count?: number
}

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium?: boolean
  created_at: string
  admin_id?: string | null
}

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
}

interface FeedHighlightedSidebarProps {
  spotlight: SpotlightData | null
  featuredGrid: FeaturedGrid | null
  supabaseUrl?: string
  polls: Poll[]
  userResponses?: Record<string, string>
  voteCounts?: Record<string, Record<string, number>>
  featuredNews: NewsStory[]
  discussionPosts: any[]
  pollDiscussionPostsByPollId?: Record<string, any[]>
}

const gradientCardStyle = {
  background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)',
}
const gradientCardOuter = 'h-full rounded-lg p-[2px]'
const gradientCardInner =
  'flex h-full min-h-0 flex-col rounded-[6px] bg-black p-6 text-left shadow transition-colors hover:bg-gradient-to-r hover:from-[#EC6D00] hover:via-[#FF006F] hover:to-[#25B4B1] cursor-pointer w-full'

export function FeedHighlightedSidebar({
  spotlight,
  featuredGrid,
  supabaseUrl,
  polls,
  userResponses = {},
  voteCounts = {},
  featuredNews,
  discussionPosts,
  pollDiscussionPostsByPollId = {},
}: FeedHighlightedSidebarProps) {
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false)
  const [activePollId, setActivePollId] = useState<string | null>(null)
  const hasHotTake = Boolean(spotlight?.hot_take)
  const hasFeaturedGrid = Boolean(featuredGrid)
  const hasPolls = polls.length > 0
  const hasNews = featuredNews.length > 0

  if (!hasHotTake && !hasFeaturedGrid && !hasPolls && !hasNews) return null

  return (
    <>
      <div className="space-y-4">
        {hasHotTake && spotlight?.hot_take && (
          <div className={gradientCardOuter} style={gradientCardStyle}>
            <button
              type="button"
              onClick={() => spotlight.hot_take?.id && setIsDiscussionOpen(true)}
              className={gradientCardInner + ' w-full min-h-[140px]'}
            >
              <div className="flex shrink-0 items-center space-x-2">
                <Radio className="h-5 w-5 text-white/90" />
                <h2 className="text-lg font-bold text-white">Hot Take</h2>
              </div>
              <div className="min-h-[3.3em] flex-1 overflow-hidden">
                <p className="text-white/90 text-base leading-relaxed line-clamp-5 pb-2">
                  {spotlight.hot_take.content_text}
                </p>
              </div>
              {spotlight.hot_take.id && (
                <p className="mt-4 shrink-0 text-sm text-white/70 flex justify-end">Tap to join the discussion</p>
              )}
            </button>
          </div>
        )}

        {hasFeaturedGrid && featuredGrid && (
          <FeaturedGridPostBlock
            grid={featuredGrid as FeaturedGridForBlock}
            user={featuredGrid.user}
            supabaseUrl={supabaseUrl}
            variant="carousel"
          />
        )}

        {hasPolls &&
          polls.map((poll) => {
            const hasVoted = !!userResponses[poll.id]
            return (
              <div key={poll.id} className={gradientCardOuter} style={gradientCardStyle}>
                <button
                  type="button"
                  onClick={() => setActivePollId(poll.id)}
                  className={gradientCardInner + ' min-h-[140px]'}
                >
                  <div className="flex shrink-0 items-start justify-between gap-2">
                    <h2 className="text-xl font-bold text-white leading-snug line-clamp-4 min-h-0 flex-1">
                      {poll.question || 'Poll'}
                    </h2>
                    {hasVoted && (
                      <span className="flex shrink-0 items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/90">
                        <Check className="h-3 w-3" />
                        Voted
                      </span>
                    )}
                  </div>
                  <p className="mt-auto shrink-0 text-xs text-white/70 text-right">
                    {hasVoted ? 'Tap to join the discussion' : 'Tap to vote'}
                  </p>
                </button>
              </div>
            )
          })}

        {hasNews &&
          featuredNews.map((news) => (
            <div key={news.id} className="min-h-[160px]">
              <FeaturedNewsCard newsStory={news} variant="carousel" />
            </div>
          ))}
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 pt-[calc(5rem+env(safe-area-inset-top))] pb-4">
          <div className="flex h-[calc(100vh-6rem)] max-h-[70vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/10 bg-black/90 shadow-2xl backdrop-blur-sm text-white">
            <div className="shrink-0 p-6 pb-0">
              <div className="mb-4 flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-white/90">
                    <Radio className="h-5 w-5" />
                    <h3 className="text-lg font-semibold text-white">Hot Take Discussion</h3>
                  </div>
                  <div className="mt-6 flex w-full justify-center">
                    <p className="text-center text-2xl tracking-wide text-white/90 rounded-lg border border-[#25B4B1] bg-sunset-gradient p-4 w-fit">{spotlight.hot_take.content_text}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDiscussionOpen(false)}
                  className="rounded-md border border-white/30 bg-transparent px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <DiscussionSection
                posts={discussionPosts || []}
                parentPageType="hot_take"
                parentPageId={spotlight.hot_take.id}
                variant="dark"
                compact
                fixedInput
              />
            </div>
          </div>
        </div>
      )}

      {activePollId && (() => {
        const poll = polls.find((p) => p.id === activePollId)
        if (!poll) return null
        return (
          <PollDiscussionModal
            poll={poll}
            userResponse={userResponses[poll.id]}
            voteCounts={voteCounts[poll.id] ?? {}}
            discussionPosts={pollDiscussionPostsByPollId[poll.id] ?? []}
            onClose={() => setActivePollId(null)}
          />
        )
      })()}
    </>
  )
}
