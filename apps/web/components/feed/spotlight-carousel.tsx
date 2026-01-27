'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Circle, Dot, Radio } from 'lucide-react'
import { PollCard } from '@/components/polls/poll-card'
import { DiscussionSection } from '@/components/dtt/discussion-section'
import { UpcomingRaceCard } from './upcoming-race-card'
import { SponsorCard } from './sponsor-card'
import { FeaturedNewsCard } from './featured-news-card'

interface SpotlightProfile {
  id: string
  username: string
  profile_image_url: string | null
}

interface SpotlightGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment: string | null
  ranked_items: any[]
  user: SpotlightProfile | null
}

interface SpotlightHotTake {
  id: string
  content_text: string
}

interface SpotlightData {
  hot_take: SpotlightHotTake | null
  featured_grid: SpotlightGrid | null
}

interface Poll {
  id: string
  question: string
  options: any[]
  is_featured_podium?: boolean
  created_at: string
  admin_id?: string | null
}

interface Race {
  id: string
  name: string
  slug: string
  start_date: string | null
  race_day_date: string | null
  location: string | null
  country: string | null
  image_url: string | null
  circuit_ref: string | null
  chat_enabled?: boolean
}

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
}

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
}

interface SpotlightCarouselProps {
  spotlight: SpotlightData | null
  polls: Poll[]
  discussionPosts: any[]
  upcomingRace?: Race | null
  sponsors?: Sponsor[]
  featuredNews?: NewsStory[]
}

export function SpotlightCarousel({ 
  spotlight, 
  polls, 
  discussionPosts, 
  upcomingRace, 
  sponsors = [], 
  featuredNews = [] 
}: SpotlightCarouselProps) {
  const hasHotTake = Boolean(spotlight?.hot_take)
  const hasFeaturedGrid = Boolean(spotlight?.featured_grid)
  const hasAdminPolls = polls.length > 0
  const hasUpcomingRace = Boolean(upcomingRace)
  const hasSponsors = sponsors.length > 0
  const hasFeaturedNews = featuredNews.length > 0

  if (!hasHotTake && !hasFeaturedGrid && !hasAdminPolls && !hasUpcomingRace && !hasSponsors && !hasFeaturedNews) return null

  const cardHeight = '25vh'
  const minCardHeight = 220
  const maxCardHeight = 380

  const cards = useMemo(() => {
    const list: Array<{ type: 'upcoming_race' | 'hot_take' | 'grid' | 'poll' | 'sponsor' | 'news'; data: any }> = []
    
    // 1. Upcoming race banner (when live) - FIRST
    if (upcomingRace) {
      list.push({ type: 'upcoming_race', data: upcomingRace })
    }
    
    // 2. Hot take (if exists)
    if (spotlight?.hot_take) {
      list.push({ type: 'hot_take', data: spotlight })
    }
    
    // 3. Admin polls (interleaved, not concurrently)
    polls.forEach((poll) => {
      list.push({ type: 'poll', data: poll })
    })
    
    // 4. Featured grid (if exists)
    if (spotlight?.featured_grid) {
      list.push({ type: 'grid', data: spotlight.featured_grid })
    }
    
    // 5. Sponsors (all sponsors)
    sponsors.forEach((sponsor) => {
      list.push({ type: 'sponsor', data: sponsor })
    })
    
    // 6. Featured news stories
    featuredNews.forEach((news) => {
      list.push({ type: 'news', data: news })
    })
    
    return list
  }, [spotlight, polls, upcomingRace, sponsors, featuredNews])

  const [activeIndex, setActiveIndex] = useState(0)
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    function onScroll() {
      const node = scrollContainerRef.current
      if (!node) return
      const width = node.clientWidth
      if (!width) return
      const idx = Math.round(node.scrollLeft / width)
      setActiveIndex(Math.min(Math.max(idx, 0), cards.length - 1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [cards.length])

  function scrollToIndex(idx: number) {
    const el = scrollContainerRef.current
    const target = cardRefs.current[idx]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
      setActiveIndex(idx)
      return
    }

    if (!el) return

    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setActiveIndex(idx)
  }

  return (
    <>
      {/* Desktop: Vertical scrollable layout */}
      <div className="hidden lg:block">
        <div className=" max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          {cards.map((card, idx) => {
            return (
              <div
                key={`${card.type}-${idx}`}
                className="w-full"
                style={{ minHeight: '100px', maxHeight: '200px', marginBottom: '24px' }}
              >
                {card.type === 'hot_take' && (
                  <div className="flex h-full w-full flex-col rounded-lg border border-red-200 bg-red-50 p-6 shadow">
                    <div className=" flex items-center space-x-2">
                      <Radio className="h-5 w-5 text-red-600" />
                      <h2 className="text-lg font-bold text-red-900">Hot Take</h2>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-gray-900 text-base leading-relaxed line-clamp-5">
                        {card.data.hot_take?.content_text || 'Hot take unavailable'}
                      </p>
                    </div>
                    {card.data.hot_take?.id && (
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setIsDiscussionOpen(true)}
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                          Join the discussion
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {card.type === 'grid' && (
                  <div className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow">
                    <div className="text-sm font-medium text-gray-600">Featured Fan Grid</div>
                    {card.data.user && (
                      <Link
                        href={`/u/${card.data.user.username}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {card.data.user.username}
                      </Link>
                    )}
                    <div className="mt-4 flex-1 space-y-2 overflow-auto">
                      {Array.isArray(card.data.ranked_items) &&
                        card.data.ranked_items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex items-center space-x-3 rounded-md bg-gray-50 p-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-900 truncate">
                              {item?.name || item?.title || 'Unknown'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {card.type === 'poll' && (
                  <div className="flex h-full w-full">
                    <PollCard
                      poll={card.data}
                      userResponse={undefined}
                      voteCounts={{}}
                      onVote={() => {}}
                      showDiscussion={false}
                    />
                  </div>
                )}

                {card.type === 'upcoming_race' && (
                  <UpcomingRaceCard race={card.data} />
                )}

                {card.type === 'sponsor' && (
                  <SponsorCard sponsor={card.data} />
                )}

                {card.type === 'news' && (
                  <FeaturedNewsCard newsStory={card.data} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: Horizontal scrolling carousel */}
      <div
        className="lg:hidden mb-6 space-y-3"
        style={{ height: cardHeight, minHeight: minCardHeight, maxHeight: maxCardHeight }}
      >
        <div
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="flex w-full h-full gap-4">
            {cards.map((card, idx) => {
              return (
                <div
                  key={`${card.type}-${idx}`}
                  ref={(el) => {
                    if (el) cardRefs.current[idx] = el
                  }}
                  className="w-full min-w-full h-full flex-shrink-0 snap-start"
                >
                  {card.type === 'hot_take' && (
                    <div className="flex h-full w-full flex-col rounded-lg border border-red-200 bg-red-50 p-6 shadow">
                      <div className="mb-4 flex items-center space-x-2">
                        <Radio className="h-5 w-5 text-red-600" />
                        <h2 className="text-lg font-bold text-red-900">Hot Take</h2>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-gray-900 text-base leading-relaxed line-clamp-5">
                          {card.data.hot_take?.content_text || 'Hot take unavailable'}
                        </p>
                      </div>
                      {card.data.hot_take?.id && (
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => setIsDiscussionOpen(true)}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                          >
                            Join the discussion
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {card.type === 'grid' && (
                    <div className="flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow">
                      <div className="mb-2 text-sm font-medium text-gray-600">Featured Fan Grid</div>
                      {card.data.user && (
                        <Link
                          href={`/u/${card.data.user.username}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {card.data.user.username}
                        </Link>
                      )}
                      <div className="mt-4 flex-1 space-y-2 overflow-auto">
                        {Array.isArray(card.data.ranked_items) &&
                          card.data.ranked_items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="flex items-center space-x-3 rounded-md bg-gray-50 p-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                                {i + 1}
                              </span>
                              <span className="text-sm text-gray-900 truncate">
                                {item?.name || item?.title || 'Unknown'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {card.type === 'poll' && (
                    <div className="flex h-full w-full min-w-full">
                      <PollCard
                        poll={card.data}
                        userResponse={undefined}
                        voteCounts={{}}
                        onVote={() => {}}
                        showDiscussion={false}
                      />
                    </div>
                  )}

                  {card.type === 'upcoming_race' && (
                    <UpcomingRaceCard race={card.data} />
                  )}

                  {card.type === 'sponsor' && (
                    <SponsorCard sponsor={card.data} />
                  )}

                  {card.type === 'news' && (
                    <FeaturedNewsCard newsStory={card.data} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-center space-x-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Go to card ${idx + 1}`}
              className="text-gray-400 hover:text-gray-700"
              onClick={() => scrollToIndex(idx)}
            >
              {idx === activeIndex ? <Dot className="h-5 w-5" /> : <Circle className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 text-red-700">
                  <Radio className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Hot Take Discussion</h3>
                </div>
                <p className="mt-2 text-gray-900">{spotlight.hot_take.content_text}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscussionOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <DiscussionSection
              posts={discussionPosts || []}
              parentPageType="hot_take"
              parentPageId={spotlight.hot_take.id}
            />
          </div>
        </div>
      )}
    </>
  )
}

