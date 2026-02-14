'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Radio, Star } from 'lucide-react'
import { PollCard } from '@/components/polls/poll-card'
import { DiscussionSection } from '@/components/dtt/discussion-section'
import { FeaturedNewsCard } from './featured-news-card'
import { getAvatarUrl } from '@/utils/avatar'

interface SpotlightHotTake {
  id: string
  content_text: string
}

interface SpotlightData {
  hot_take: SpotlightHotTake | null
}

interface HighlightedFan {
  id: string
  username: string
  profile_image_url: string | null
}

interface FeaturedGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment: string | null
  ranked_items: Array<{ id?: string; name?: string; title?: string }>
  user: { id: string; username: string; profile_image_url: string | null } | null
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
  highlightedFan: HighlightedFan | null
  featuredGrid: FeaturedGrid | null
  polls: Poll[]
  userResponses?: Record<string, string>
  voteCounts?: Record<string, Record<string, number>>
  featuredNews: NewsStory[]
  discussionPosts: any[]
}

export function FeedHighlightedSidebar({
  spotlight,
  highlightedFan,
  featuredGrid,
  polls,
  userResponses = {},
  voteCounts = {},
  featuredNews,
  discussionPosts,
}: FeedHighlightedSidebarProps) {
  const router = useRouter()
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false)
  const hasHotTake = Boolean(spotlight?.hot_take)
  const hasHighlightedFan = Boolean(highlightedFan)
  const hasFeaturedGrid = Boolean(featuredGrid)
  const hasPolls = polls.length > 0
  const hasNews = featuredNews.length > 0

  if (!hasHotTake && !hasHighlightedFan && !hasFeaturedGrid && !hasPolls && !hasNews) return null

  return (
    <>
      <div className="space-y-4">
        {hasHotTake && spotlight?.hot_take && (
          <button
            type="button"
            onClick={() => setIsDiscussionOpen(true)}
            className="flex w-full flex-col rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm text-left hover:bg-white/5 transition-colors cursor-pointer min-h-[140px]"
          >
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-white/90 shrink-0" />
              <h2 className="text-lg font-bold text-white">Hot Take</h2>
            </div>
            <p className="mt-2 text-white/90 text-sm leading-relaxed line-clamp-4">
              {spotlight.hot_take.content_text}
            </p>
            <p className="mt-3 text-xs text-white/70">Tap to join the discussion</p>
          </button>
        )}

        {hasHighlightedFan && highlightedFan && (
          <Link
            href={`/u/${highlightedFan.username}`}
            className="flex w-full items-center gap-4 rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm transition-colors hover:bg-white/5"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-white/10">
              <Image
                src={getAvatarUrl(highlightedFan.profile_image_url)}
                alt={highlightedFan.username}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                <Star className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Highlighted Fan</span>
              </div>
              <p className="mt-0.5 font-semibold text-white">@{highlightedFan.username}</p>
            </div>
          </Link>
        )}

        {hasFeaturedGrid && featuredGrid && (
          <div className="flex flex-col rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm">
            <div className="text-sm font-medium text-white/90">Featured Fan Grid</div>
            {featuredGrid.user && (
              <Link
                href={`/u/${featuredGrid.user.username}`}
                className="mt-1 text-white/90 hover:text-white text-sm"
              >
                @{featuredGrid.user.username}
              </Link>
            )}
            {featuredGrid.comment && (
              <p className="mt-2 text-sm text-white/80 italic">&quot;{featuredGrid.comment}&quot;</p>
            )}
            <div className="mt-4 space-y-2">
              {Array.isArray(featuredGrid.ranked_items) &&
                featuredGrid.ranked_items.slice(0, 5).map((item: { id?: string; name?: string; title?: string }, i: number) => (
                  <div
                    key={item?.id ?? i}
                    className="flex items-center space-x-3 rounded-md bg-white/10 px-3 py-2"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="min-w-0 truncate text-sm text-white/90">
                      {item?.name ?? item?.title ?? 'Unknown'}
                    </span>
                  </div>
                ))}
            </div>
            {featuredGrid.user && (
              <Link
                href={`/u/${featuredGrid.user.username}`}
                className="mt-4 inline-block text-sm font-medium text-[#25B4B1] hover:underline"
              >
                View full grid →
              </Link>
            )}
          </div>
        )}

        {hasPolls &&
          polls.map((poll) => (
            <div
              key={poll.id}
              className="rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm min-h-[120px]"
            >
              <PollCard
                poll={{
                  ...poll,
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

        {hasNews &&
          featuredNews.map((news) => (
            <div key={news.id} className="min-h-[180px]">
              <FeaturedNewsCard newsStory={news} />
            </div>
          ))}
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-sm text-white">
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
            <DiscussionSection
              posts={discussionPosts || []}
              parentPageType="hot_take"
              parentPageId={spotlight.hot_take.id}
              variant="dark"
            />
          </div>
        </div>
      )}
    </>
  )
}
