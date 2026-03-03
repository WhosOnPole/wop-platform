'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Radio, Check } from 'lucide-react'
import { DiscussionSection } from '@/components/dtt/discussion-section'
import { PollDiscussionModal } from '@/components/polls/poll-discussion-modal'
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
  username?: string | null
  profile_image_url?: string | null
  is_anonymous?: boolean
}

interface SpotlightCarouselProps {
  spotlight: SpotlightData | null
  supabaseUrl?: string
  polls: Poll[]
  userResponses?: Record<string, string>
  voteCounts?: Record<string, Record<string, number>>
  discussionPosts: any[]
  pollDiscussionPostsByPollId?: Record<string, any[]>
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
  pollDiscussionPostsByPollId = {},
  upcomingRace,
  sponsors = [],
  featuredNews = [],
}: SpotlightCarouselProps) {
  const hasHotTake = Boolean(spotlight?.hot_take)
  const hasFeaturedGrid = Boolean(spotlight?.featured_grid)
  const hasAdminPolls = polls.length > 0
  const hasUpcomingRace = Boolean(upcomingRace)
  const hasSponsors = sponsors.length > 0
  const featuredStory = featuredNews?.[0] ?? null

  if (!hasHotTake && !hasFeaturedGrid && !hasAdminPolls && !hasUpcomingRace && !hasSponsors && !featuredStory) return null

  // Rectangular banner cards (desktop scroll / mobile carousel) — no min height, content-sized like hot take
  const bannerCardHeight = 160

  const cards = useMemo(() => {
    const list: Array<{ type: 'upcoming_race' | 'hot_take' | 'grid' | 'poll' | 'sponsor' | 'featured_story'; data: any }> = []
    
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
    
    // 4. Featured story (if exists)
    if (featuredStory) {
      list.push({ type: 'featured_story', data: featuredStory })
    }
    
    // 5. Featured grid (if exists)
    if (spotlight?.featured_grid) {
      list.push({ type: 'grid', data: spotlight.featured_grid })
    }
    
    // 6. Sponsors (all sponsors)
    sponsors.forEach((sponsor) => {
      list.push({ type: 'sponsor', data: sponsor })
    })
    
    return list
  }, [spotlight, polls, upcomingRace, sponsors, featuredStory])

  const [activeIndex, setActiveIndex] = useState(0)
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false)
  const [activePollId, setActivePollId] = useState<string | null>(null)
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
              <p className="mt-4 shrink-0 text-sm text-white/70 flex justify-end">Tap to join the discussion</p>
            )}
          </button>
        </div>
      )
    }
    if (card.type === 'grid') {
      return (
        <div className={gradientCardOuter} style={gradientCardStyle}>
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[6px] bg-black px-4 py-2 ">
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
          <button
            type="button"
            onClick={() => setActivePollId(poll.id)}
            className={gradientCardInner + ' cursor-pointer'}
          >
            <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
              Admin Poll
            </span>
            <div className="flex shrink-0 items-start justify-between gap-2 mt-0.5">
              <h2 className="text-xl font-bold text-white leading-snug line-clamp-5 min-h-0 flex-1">
                {poll.question || 'Poll'}
              </h2>
              {hasVoted && (
                <span className="flex shrink-0 items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/90">
                  <Check className="h-3 w-3" />
                  Voted
                </span>
              )}
            </div>
            <p className="mt-auto shrink-0 text-sm text-white/70 text-right">
              {hasVoted ? 'Tap to join the discussion' : 'Tap to vote'}
            </p>
          </button>
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
    if (card.type === 'featured_story') {
      const story = card.data as NewsStory
      const href = `/story/${story.id}`
      const firstLine = (() => {
        const c = story.content?.trim() || ''
        const lines = c.split(/\r?\n/).filter((l) => l.trim())
        if (lines.length > 0) return lines[0].trim()
        return c.length > 50 ? c.slice(0, 50).trim() + '…' : c
      })()
      const showAuthorAvatar = !story.is_anonymous && story.profile_image_url
      const avatarSrc = showAuthorAvatar ? story.profile_image_url! : '/images/seal_white.png'
      return (
        <div className={gradientCardOuter + ' relative'} style={gradientCardStyle}>
          <Link
            href={href}
            className={gradientCardInner + ' cursor-pointer relative'}
          >
            <div className="absolute right-4 top-4 z-10 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/30">
              <Image
                src={avatarSrc}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col min-h-0">
              <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
                Featured Story
              </span>
              <h2 className="text-xl font-bold text-white leading-snug line-clamp-3 my-0.5">
                {story.title || 'Story'}
              </h2>
              {firstLine && (
                <p className=" text-sm text-white/90 line-clamp-1">{firstLine}</p>
              )}
              {story.username && !story.is_anonymous && (
                <p className="mt-1 text-sm text-white/70">by @{story.username}</p>
              )}
            </div>
            <p className="mt-auto shrink-0 text-sm text-white/70 text-right">
              Read more →
            </p>
          </Link>
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

        {/* Dot indicators (mobile only) */}
        <nav
          className="flex justify-center gap-1.5 py-3 lg:hidden"
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
              className={`rounded-full transition-all ${
                activeIndex === idx
                  ? 'w-2.5 h-2.5 bg-bright-teal'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </nav>
      </div>

      {isDiscussionOpen && spotlight?.hot_take?.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-black/90 p-6 shadow-2xl backdrop-blur-sm text-white">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 text-white/90">
                  <Radio className="h-5 w-5" />
                  <h3 className="text-xl font-semibold text-white">Hot Take Discussion</h3>
                </div>
                <p className="mt-4 text-white/90">{spotlight.hot_take.content_text}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscussionOpen(false)}
                className="rounded-md text-md font-black text-sunset-end transition-colors hover:bg-white/10"
              >
                X
              </button>
            </div>
            <DiscussionSection
              posts={discussionPosts || []}
              parentPageType="hot_take"
              parentPageId={spotlight.hot_take.id}
              variant="dark"
              compact
            />
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

