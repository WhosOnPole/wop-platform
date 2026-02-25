'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Radio, BarChart3, Check } from 'lucide-react'
import { DiscussionSection } from '@/components/dtt/discussion-section'
import { UpcomingRaceCard } from './upcoming-race-card'
import { SponsorCard } from './sponsor-card'
import { FeaturedGridCarouselCard } from './featured-grid-carousel-card'

interface SpotlightProfile {
  id: string
  username: string
  profile_image_url: string | null
}

interface SpotlightGrid {
  id: string
  type: 'driver' | 'team' | 'track'
  comment?: string | null
  blurb?: string | null
  ranked_items: any[]
  user: SpotlightProfile | null
  updated_at?: string | null
  created_at?: string | null
  like_count?: number
  comment_count?: number
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
  end_date: string | null
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
  supabaseUrl?: string
  polls: Poll[]
  userResponses?: Record<string, string>
  voteCounts?: Record<string, Record<string, number>>
  discussionPosts: any[]
  upcomingRace?: Race | null
  sponsors?: Sponsor[]
  featuredNews?: NewsStory[]
}

export function SpotlightCarousel({
  spotlight,
  supabaseUrl,
  polls,
  userResponses = {},
  voteCounts = {},
  discussionPosts,
  upcomingRace,
  sponsors = [],
  featuredNews = [],
}: SpotlightCarouselProps) {
  const router = useRouter()
  const hasHotTake = Boolean(spotlight?.hot_take)
  const hasFeaturedGrid = Boolean(spotlight?.featured_grid)
  const hasAdminPolls = polls.length > 0
  const hasUpcomingRace = Boolean(upcomingRace)
  const hasSponsors = sponsors.length > 0

  if (!hasHotTake && !hasFeaturedGrid && !hasAdminPolls && !hasUpcomingRace && !hasSponsors) return null

  // Rectangular banner cards (desktop scroll / mobile carousel) — no min height, content-sized like hot take
  const bannerCardHeight = 160

  const cards = useMemo(() => {
    const list: Array<{ type: 'upcoming_race' | 'hot_take' | 'grid' | 'poll' | 'sponsor'; data: any }> = []
    
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

    // Featured stories are shown only in Podiums > Stories tab with a Featured pill (no duplicate in carousel)
    
    return list
  }, [spotlight, polls, upcomingRace, sponsors])

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

  const gradientCardStyle = {
    background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)',
  }
  const gradientCardOuter = 'h-full rounded-lg p-[2px]'
  const gradientCardInner =
    'flex h-full min-h-0 flex-col rounded-[6px] bg-black p-6 text-left shadow transition-colors hover:bg-gradient-to-r hover:from-[#EC6D00] hover:via-[#FF006F] hover:to-[#25B4B1]'

  function renderCard(card: CardItem) {
    if (card.type === 'hot_take') {
      return (
        <div className={gradientCardOuter} style={gradientCardStyle}>
          <button
            type="button"
            onClick={() => card.data.hot_take?.id && setIsDiscussionOpen(true)}
            className={gradientCardInner + ' cursor-pointer'}
          >
            <div className="flex shrink-0 items-center space-x-2">
              <Radio className="h-5 w-5 text-white/90" />
              <h2 className="text-lg font-bold text-white">Hot Take</h2>
            </div>
            <div className="min-h-[3.3em] flex-1 overflow-hidden">
              <p className="text-white/90 text-base leading-relaxed line-clamp-5 pb-2">
                {card.data.hot_take?.content_text || 'Hot take unavailable'}
              </p>
            </div>
            {card.data.hot_take?.id && (
              <p className="mt-4 shrink-0 text-sm text-white/70">Tap to join the discussion</p>
            )}
          </button>
        </div>
      )
    }
    if (card.type === 'grid') {
      return (
        <div className={`${gradientCardOuter} border border-white/20`}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[6px] bg-black px-4 py-4">
            <FeaturedGridCarouselCard
              grid={card.data}
              user={card.data.user}
              supabaseUrl={supabaseUrl}
            />
          </div>
        </div>
      )
    }
    if (card.type === 'poll') {
      const poll = card.data as Poll
      const hasVoted = !!userResponses[poll.id]
      return (
        <div className={gradientCardOuter} style={gradientCardStyle}>
          <Link
            href={`/podiums?poll=${poll.id}`}
            className={gradientCardInner}
          >
            <div className="flex shrink-0 items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-white/90 shrink-0" />
              <h2 className="text-lg font-bold text-white">Featured Poll</h2>
              {hasVoted && (
                <span className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/90">
                  <Check className="h-3 w-3" />
                  Voted
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <p className="text-white/90 text-base leading-relaxed line-clamp-5">
                {poll.question || 'Poll'}
              </p>
            </div>
            <p className="mt-4 shrink-0 text-sm text-white/70">
              {hasVoted ? 'View results →' : 'Tap to vote →'}
            </p>
          </Link>
        </div>
      )
    }
    if (card.type === 'upcoming_race') {
      return (
        <div className={gradientCardOuter} style={gradientCardStyle}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[6px] bg-black p-6">
            <UpcomingRaceCard race={card.data} />
          </div>
        </div>
      )
    }
    if (card.type === 'sponsor') {
      return (
        <div className={gradientCardOuter} style={gradientCardStyle}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[6px] bg-black p-6">
            <SponsorCard sponsor={card.data} />
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {/* Single container: horizontal carousel on mobile, vertical scroll on desktop; relative z-10 so slider/tabs stay above feed content */}
      <div className="relative z-10 mb-0 flex flex-col lg:block lg:h-auto lg:min-h-0 lg:max-h-none">
        <div
          ref={scrollContainerRef}
          className="flex flex-shrink-0 flex-row lg:h-auto lg:min-h-0 lg:max-h-[calc(100vh-8rem)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-2 w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory lg:snap-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'x mandatory', height: bannerCardHeight }}
        >
          <div className="flex w-full h-full gap-4 lg:flex-col lg:gap-0">
            {cards.map((card, idx) => (
              <div
                key={`${card.type}-${idx}`}
                ref={(el) => {
                  if (el) cardRefs.current[idx] = el
                }}
                className="w-full min-w-full lg:min-w-0 flex-shrink-0 snap-start lg:snap-align-none overflow-hidden flex-none h-full"
                style={{
                  minHeight: bannerCardHeight,
                  marginBottom: idx < cards.length - 1 ? 24 : 0,
                }}
              >
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>

        {/* Indicator bar: flush under cards (mobile only) */}
        <div className="w-full flex-shrink-0 border-b border-white/20 lg:hidden">
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
                    ? 'border-bright-teal'
                    : 'border-transparent hover:border-white/30'
                }`}
              />
            ))}
          </nav>
        </div>
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-6 shadow-2xl mt-16 backdrop-blur-sm text-white">
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
                className="rounded-md text-sm font-black text-sunset-end transition-colors hover:bg-white/10"
              >
                X
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

