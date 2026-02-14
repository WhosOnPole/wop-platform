'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Radio } from 'lucide-react'
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

  // Full-height banner cards (desktop scroll / mobile carousel)
  const bannerCardHeight = 200

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

  function scrollToIndex(idx: number, instant?: boolean) {
    const el = scrollContainerRef.current
    const target = cardRefs.current[idx]
    const behavior = instant ? 'auto' : 'smooth'
    if (target) {
      target.scrollIntoView({ behavior, inline: 'start', block: 'nearest' })
      setActiveIndex(idx)
      return
    }

    if (!el) return

    el.scrollTo({ left: idx * el.clientWidth, behavior })
    setActiveIndex(idx)
  }

  type CardItem = (typeof cards)[number]

  function renderCard(card: CardItem) {
    if (card.type === 'hot_take') {
      return (
        <button
          type="button"
          onClick={() => card.data.hot_take?.id && setIsDiscussionOpen(true)}
          className="flex h-full w-full flex-col rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow text-left hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Radio className="h-5 w-5 text-white/90" />
            <h2 className="text-lg font-bold text-white">Hot Take</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white/90 text-base leading-relaxed line-clamp-5">
              {card.data.hot_take?.content_text || 'Hot take unavailable'}
            </p>
          </div>
          {card.data.hot_take?.id && (
            <p className="mt-4 text-sm text-white/70">Tap to join the discussion</p>
          )}
        </button>
      )
    }
    if (card.type === 'grid') {
      return (
        <div className="flex h-full w-full flex-col rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow">
          <div className="text-sm font-medium text-white/90">Featured Fan Grid</div>
          {card.data.user && (
            <Link
              href={`/u/${card.data.user.username}`}
              className="text-white/90 hover:text-white text-sm"
            >
              {card.data.user.username}
            </Link>
          )}
          <div className="mt-4 flex-1 space-y-2 overflow-auto">
            {Array.isArray(card.data.ranked_items) &&
              card.data.ranked_items.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex items-center space-x-3 rounded-md bg-white/10 p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-white/90 truncate">
                    {item?.name || item?.title || 'Unknown'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )
    }
    if (card.type === 'poll') {
      return (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm">
          <PollCard
            poll={card.data}
            userResponse={undefined}
            voteCounts={{}}
            onVote={() => {}}
            showDiscussion={false}
            variant="dark"
            className="min-h-0 flex-1 overflow-auto border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
          />
        </div>
      )
    }
    if (card.type === 'upcoming_race') {
      return <UpcomingRaceCard race={card.data} />
    }
    if (card.type === 'sponsor') {
      return <SponsorCard sponsor={card.data} />
    }
    if (card.type === 'news') {
      return <FeaturedNewsCard newsStory={card.data} />
    }
    return null
  }

  return (
    <>
      {/* Single container: horizontal carousel on mobile, vertical scroll on desktop */}
      <div className="mb-6 lg:mb-0 h-[200px] min-h-[200px] max-h-[200px] lg:h-auto lg:min-h-0 lg:max-h-none">
        <div
          ref={scrollContainerRef}
          className="flex flex-row lg:flex-col w-full h-full lg:max-h-[calc(100vh-8rem)] overflow-x-auto overflow-y-hidden lg:overflow-x-hidden lg:overflow-y-auto snap-x snap-mandatory lg:snap-none pb-2 lg:pr-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="flex w-full h-full gap-4 lg:flex-col lg:gap-0">
            {cards.map((card, idx) => (
              <div
                key={`${card.type}-${idx}`}
                ref={(el) => {
                  if (el) cardRefs.current[idx] = el
                }}
                className="w-full min-w-full lg:min-w-0 flex-shrink-0 snap-start lg:snap-align-none overflow-hidden flex-none"
                style={{
                  height: bannerCardHeight,
                  marginBottom: idx < cards.length - 1 ? 24 : 0,
                }}
              >
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>

        {/* Indicator bar: notification-style tabs (mobile only) */}
        <div className="mt-3 w-full border-b border-white/20 lg:hidden">
          <nav
            className="-mb-px flex w-full"
            role="tablist"
            aria-label="Featured banner position"
          >
            {cards.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={activeIndex === idx}
                aria-label={`Slide ${idx + 1} of ${cards.length}`}
                onClick={() => scrollToIndex(idx)}
                className={`flex-1 min-w-0 border-b-2 py-3 transition-colors ${
                  activeIndex === idx
                    ? 'border-[#25B4B1]'
                    : 'border-transparent hover:border-white/30'
                }`}
              />
            ))}
          </nav>
        </div>
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-sm text-white">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 text-white/90">
                  <Radio className="h-5 w-5" />
                  <h3 className="text-lg font-semibold text-white">Hot Take Discussion</h3>
                </div>
                <p className="mt-2 text-white/90">{spotlight.hot_take.content_text}</p>
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

