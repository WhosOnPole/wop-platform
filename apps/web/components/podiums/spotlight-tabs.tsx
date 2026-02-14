'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, PenLine } from 'lucide-react'
import { PollList } from '@/components/polls/poll-list'
import { FeaturedNewsCard } from '@/components/feed/featured-news-card'
import { SponsorCard } from '@/components/feed/sponsor-card'
import { getAvatarUrl } from '@/utils/avatar'

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
  href?: string
}

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
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

interface SpotlightTabsProps {
  adminPolls: Poll[]
  communityPolls: Poll[]
  userResponses: Record<string, string>
  voteCounts: Record<string, Record<string, number>>
  stories: NewsStory[]
  sponsors: Sponsor[]
  highlightedFan: HighlightedFan | null
  featuredGrid: FeaturedGrid | null
}

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  showDivider?: boolean
}

function TabButton({ label, active, onClick, showDivider = false }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`relative flex w-1/3 flex-1 items-center justify-center bg-white px-4 py-2.5 text-xs uppercase tracking-wide transition hover:text-white ${
        active ? 'text-white bg-opacity-30' : 'bg-opacity-[19%] text-[#FFFFFF50]'
      }`}
    >
      {label}
      {showDivider ? (
        <span className="pointer-events-none absolute right-0 top-1 bottom-1 w-[.5px] bg-white/20" />
      ) : null}
    </button>
  )
}

export function SpotlightTabs({
  adminPolls,
  communityPolls,
  userResponses,
  voteCounts,
  stories,
  sponsors,
  highlightedFan,
  featuredGrid,
}: SpotlightTabsProps) {
  const [activeTab, setActiveTab] = useState<'polls' | 'stories' | 'our-picks'>('polls')

  const adminPollsWithFeatured = adminPolls.map((p) => ({
    ...p,
    is_featured_podium: p.is_featured_podium ?? false,
  }))
  const communityPollsWithFeatured = communityPolls.map((p) => ({
    ...p,
    is_featured_podium: p.is_featured_podium ?? false,
  }))

  return (
    <div className="space-y-6">
      <nav
        className="flex w-full overflow-hidden rounded-full"
        role="tablist"
        aria-label="Spotlight sections"
      >
        <TabButton
          label="Polls"
          active={activeTab === 'polls'}
          onClick={() => setActiveTab('polls')}
          showDivider
        />
        <TabButton
          label="Stories"
          active={activeTab === 'stories'}
          onClick={() => setActiveTab('stories')}
          showDivider
        />
        <TabButton
          label="Our Picks"
          active={activeTab === 'our-picks'}
          onClick={() => setActiveTab('our-picks')}
        />
      </nav>

      {activeTab === 'polls' && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Admin polls</h2>
            <div className="rounded-xl border border-white/20 bg-white/5 overflow-hidden">
              {adminPollsWithFeatured.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto p-4">
                  <PollList
                    polls={adminPollsWithFeatured}
                    userResponses={userResponses}
                    voteCounts={voteCounts}
                    variant={'dark'}
                  />
                </div>
              ) : (
                <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-white/20 p-6 text-sm text-white/60">
                  No admin polls yet.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Community polls</h2>
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">
              <PollList
                polls={communityPollsWithFeatured}
                userResponses={userResponses}
                voteCounts={voteCounts}
                variant={'dark'}
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="space-y-8">
                    <div className="rounded-xl border border-white/20 bg-white/5 p-6 text-center">
            <p className="mb-4 text-white/90">Have a story? Submit it for our team to consider.</p>
            <Link
              href="/submit-story"
              className="inline-flex items-center gap-2 rounded-lg bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#25B4B1]/90"
            >
              <PenLine className="h-4 w-4" />
              Submit a story
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stories.length > 0 ? (
              stories.map((story) => (
                <div key={story.id} className="min-h-[200px]">
                  <FeaturedNewsCard newsStory={story} />
                </div>
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-white/60">No stories yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'our-picks' && (
        <div className="space-y-8">
          {sponsors.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Sponsors</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sponsors.map((sponsor) => (
                  <SponsorCard key={sponsor.id} sponsor={sponsor} />
                ))}
              </div>
            </section>
          )}

          {highlightedFan && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Highlighted Fan</h2>
              <Link
                href={`/u/${highlightedFan.username}`}
                className="flex w-full items-center gap-4 rounded-lg border border-white/20 bg-white/5 p-4 transition-colors hover:bg-white/10"
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
                    <Star className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Highlighted Fan</span>
                  </div>
                  <p className="mt-0.5 font-semibold text-white">@{highlightedFan.username}</p>
                </div>
              </Link>
            </section>
          )}

          {featuredGrid && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Featured Fan Grid</h2>
              <div className="flex flex-col rounded-lg border border-white/20 bg-white/5 p-6">
                {featuredGrid.user && (
                  <Link
                    href={`/u/${featuredGrid.user.username}`}
                    className="text-sm text-white/90 hover:text-white"
                  >
                    @{featuredGrid.user.username}
                  </Link>
                )}
                {featuredGrid.comment && (
                  <p className="mt-2 text-sm italic text-white/80">&quot;{featuredGrid.comment}&quot;</p>
                )}
                <div className="mt-4 space-y-2">
                  {Array.isArray(featuredGrid.ranked_items) &&
                    featuredGrid.ranked_items.slice(0, 5).map((item, i) => (
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
            </section>
          )}

          {sponsors.length === 0 && !highlightedFan && !featuredGrid && (
            <p className="py-8 text-center text-white/60">No picks this week. Check back soon.</p>
          )}
        </div>
      )}
    </div>
  )
}
