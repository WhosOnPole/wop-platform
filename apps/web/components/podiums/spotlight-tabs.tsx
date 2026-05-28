'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PenLine, Check, Plus, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { PollCard } from '@/components/polls/poll-card'
import { PollDiscussionModal } from '@/components/polls/poll-discussion-modal'
import { useCreateModal } from '@/components/providers/create-modal-provider'
import { FeaturedNewsCard } from '@/components/feed/featured-news-card'
import { SponsorCard } from '@/components/feed/sponsor-card'
import { FeaturedGridPostBlock, type FeaturedGridForBlock } from '@/components/feed/featured-grid-post-block'
import { getGridTypeLabel } from '../feed/featured-grid-tiles'

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
  is_featured?: boolean
  username?: string | null
  profile_image_url?: string | null
}

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
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

interface SpotlightTabsProps {
  adminPolls: Poll[]
  adminPollsHasMore?: boolean
  communityPolls: Poll[]
  communityPollsHasMore?: boolean
  userResponses: Record<string, string>
  voteCounts: Record<string, Record<string, number>>
  stories: NewsStory[]
  sponsors: Sponsor[]
  featuredGrid: FeaturedGrid | null
  supabaseUrl?: string
  pollDiscussionPostsByPollId?: Record<string, any[]>
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

const gradientCardStyle = {
  background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)',
}
const gradientCardOuter = 'h-full rounded-lg p-[2px]'
const gradientCardInner =
  'flex h-full min-h-0 flex-col rounded-[6px] bg-black p-6 text-left shadow transition-colors hover:bg-gradient-to-r hover:from-[#EC6D00] hover:via-[#FF006F] hover:to-[#25B4B1] cursor-pointer w-full'

const POLLS_PAGE_SIZE = 10

const pollsSectionTitleClass =
  'w-full text-md font-light tracking-wide text-white [font-variant:small-caps]'

const pollsLoadMoreButtonClass =
  'inline-flex shrink-0 items-center gap-1 rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-normal tracking-wide text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60 [font-variant:small-caps]'

export function SpotlightTabs({
  adminPolls: initialAdminPolls,
  adminPollsHasMore = false,
  communityPolls: initialCommunityPolls,
  communityPollsHasMore = false,
  userResponses,
  voteCounts,
  stories,
  sponsors,
  featuredGrid,
  supabaseUrl,
  pollDiscussionPostsByPollId = {},
}: SpotlightTabsProps) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activePollId, setActivePollId] = useState<string | null>(null)
  const [adminPollsList, setAdminPollsList] = useState(initialAdminPolls)
  const [hasMoreAdminPolls, setHasMoreAdminPolls] = useState(adminPollsHasMore)
  const [loadingMoreAdminPolls, setLoadingMoreAdminPolls] = useState(false)
  const [communityPollsList, setCommunityPollsList] = useState(initialCommunityPolls)
  const [hasMoreCommunityPolls, setHasMoreCommunityPolls] = useState(communityPollsHasMore)
  const [loadingMoreCommunityPolls, setLoadingMoreCommunityPolls] = useState(false)
  const [extraUserResponses, setExtraUserResponses] = useState<Record<string, string>>({})
  const [extraVoteCounts, setExtraVoteCounts] = useState<Record<string, Record<string, number>>>({})
  const createModal = useCreateModal()
  const setActiveModal = createModal?.setActiveModal ?? (() => {})
  const tabFromUrl = searchParams.get('tab')
  const validTab =
    tabFromUrl === 'polls' || tabFromUrl === 'stories' || tabFromUrl === 'our-picks'
      ? tabFromUrl
      : null
  const [activeTab, setActiveTab] = useState<'polls' | 'stories' | 'our-picks'>(validTab ?? 'polls')

  useEffect(() => {
    if (validTab) setActiveTab(validTab)
  }, [validTab])

  useEffect(() => {
    setAdminPollsList(initialAdminPolls)
    setHasMoreAdminPolls(adminPollsHasMore)
  }, [initialAdminPolls, adminPollsHasMore])

  useEffect(() => {
    setCommunityPollsList(initialCommunityPolls)
    setHasMoreCommunityPolls(communityPollsHasMore)
  }, [initialCommunityPolls, communityPollsHasMore])

  const mergedUserResponses = { ...userResponses, ...extraUserResponses }
  const mergedVoteCounts = { ...voteCounts, ...extraVoteCounts }

  async function mergeVoteDataForPollIds(newPollIds: string[]) {
    if (newPollIds.length === 0) return

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      const { data: responses } = await supabase
        .from('poll_responses')
        .select('poll_id, selected_option_id')
        .eq('user_id', session.user.id)
        .in('poll_id', newPollIds)

      if (responses?.length) {
        setExtraUserResponses((current) => ({
          ...current,
          ...responses.reduce(
            (acc, response) => {
              acc[response.poll_id] = response.selected_option_id
              return acc
            },
            {} as Record<string, string>
          ),
        }))
      }
    }

    const { data: allResponses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .in('poll_id', newPollIds)

    if (allResponses?.length) {
      setExtraVoteCounts((current) => {
        const next = { ...current }
        for (const response of allResponses) {
          if (!next[response.poll_id]) next[response.poll_id] = {}
          next[response.poll_id][response.selected_option_id] =
            (next[response.poll_id][response.selected_option_id] || 0) + 1
        }
        return next
      })
    }
  }

  async function loadMoreAdminPolls() {
    if (loadingMoreAdminPolls || !hasMoreAdminPolls) return

    setLoadingMoreAdminPolls(true)
    const offset = adminPollsList.length

    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .not('admin_id', 'is', null)
        .order('is_featured_podium', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + POLLS_PAGE_SIZE - 1)

      if (error) throw error

      const newPolls = (data || []) as Poll[]
      if (newPolls.length === 0) {
        setHasMoreAdminPolls(false)
        return
      }

      setAdminPollsList((current) => {
        const existingIds = new Set(current.map((poll) => poll.id))
        const uniqueNewPolls = newPolls.filter((poll) => !existingIds.has(poll.id))
        return [...current, ...uniqueNewPolls]
      })
      setHasMoreAdminPolls(newPolls.length === POLLS_PAGE_SIZE)

      await mergeVoteDataForPollIds(newPolls.map((poll) => poll.id))
    } catch (error) {
      console.error('Error loading more admin polls:', error)
    } finally {
      setLoadingMoreAdminPolls(false)
    }
  }

  async function loadMoreCommunityPolls() {
    if (loadingMoreCommunityPolls || !hasMoreCommunityPolls) return

    setLoadingMoreCommunityPolls(true)
    const offset = communityPollsList.length

    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .is('admin_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + POLLS_PAGE_SIZE - 1)

      if (error) throw error

      const newPolls = (data || []) as Poll[]
      if (newPolls.length === 0) {
        setHasMoreCommunityPolls(false)
        return
      }

      setCommunityPollsList((current) => {
        const existingIds = new Set(current.map((poll) => poll.id))
        const uniqueNewPolls = newPolls.filter((poll) => !existingIds.has(poll.id))
        return [...current, ...uniqueNewPolls]
      })
      setHasMoreCommunityPolls(newPolls.length === POLLS_PAGE_SIZE)

      await mergeVoteDataForPollIds(newPolls.map((poll) => poll.id))
    } catch (error) {
      console.error('Error loading more community polls:', error)
    } finally {
      setLoadingMoreCommunityPolls(false)
    }
  }

  const adminPollsWithFeatured = [...adminPollsList]
    .map((p) => ({
      ...p,
      is_featured_podium: p.is_featured_podium ?? false,
    }))
    .sort((a, b) => {
      if (a.is_featured_podium && !b.is_featured_podium) return -1
      if (!a.is_featured_podium && b.is_featured_podium) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  const communityPollsWithFeatured = communityPollsList.map((p) => ({
    ...p,
    is_featured_podium: p.is_featured_podium ?? false,
  }))
  const allPollsWithFeatured = [...adminPollsWithFeatured, ...communityPollsWithFeatured]
  function handleClosePollDiscussionModal() {
    setActivePollId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('open')
    params.delete('poll')
    params.delete('post')
    params.delete('comment')
    if (!params.get('tab')) params.set('tab', 'polls')
    const query = params.toString()
    router.replace(query ? `/podiums?${query}` : '/podiums?tab=polls', { scroll: false })
  }
  useEffect(() => {
    const pollId = searchParams.get('poll')
    const openMode = searchParams.get('open')
    if (!pollId || openMode !== 'poll-discussion') return
    if (!allPollsWithFeatured.some((p) => p.id === pollId)) return
    setActiveTab('polls')
    setActivePollId(pollId)
  }, [searchParams, allPollsWithFeatured])
  const adminPollsCount = adminPollsWithFeatured.length
  const [adminPollsActiveIndex, setAdminPollsActiveIndex] = useState(0)
  const adminPollsScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = adminPollsScrollRef.current
    if (!el || adminPollsCount < 2) return

    function onScroll() {
      const node = adminPollsScrollRef.current
      if (!node) return
      const width = node.clientWidth
      if (!width) return
      const idx = Math.round(node.scrollLeft / width)
      setAdminPollsActiveIndex(Math.min(Math.max(idx, 0), adminPollsCount - 1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [adminPollsCount])

  return (
    <div className="w-full min-w-0 ">
      <nav
        className="flex w-full overflow-hidden rounded-full"
        role="tablist"
        aria-label="Spotlight sections"
      >
        <TabButton
          label="Polls"
          active={activeTab === 'polls'}
          onClick={() => {
            setActiveTab('polls')
            router.replace('/podiums?tab=polls', { scroll: false })
          }}
          showDivider
        />
        <TabButton
          label="Stories"
          active={activeTab === 'stories'}
          onClick={() => {
            setActiveTab('stories')
            router.replace('/podiums?tab=stories', { scroll: false })
          }}
          showDivider
        />
        <TabButton
          label="Our Picks"
          active={activeTab === 'our-picks'}
          onClick={() => {
            setActiveTab('our-picks')
            router.replace('/podiums?tab=our-picks', { scroll: false })
          }}
        />
      </nav>

      {activeTab === 'polls' && (
        <div className="w-full min-w-0 space-y-8">
          <section className="w-full min-w-0 space-y-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className={pollsSectionTitleClass}>Admin polls</h2>
              {hasMoreAdminPolls &&
                adminPollsCount > 0 &&
                adminPollsActiveIndex === adminPollsCount - 1 && (
                  <button
                    type="button"
                    onClick={loadMoreAdminPolls}
                    disabled={loadingMoreAdminPolls}
                    className={pollsLoadMoreButtonClass}
                  >
                    {loadingMoreAdminPolls ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading
                      </>
                    ) : (
                      'load more...'
                    )}
                  </button>
                )}
            </div>
            {adminPollsWithFeatured.length > 0 ? (
              <div className="space-y-3">
                <div
                  ref={adminPollsScrollRef}
                  className="flex w-full min-w-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {adminPollsWithFeatured.map((poll) => {
                  const hasVoted = !!mergedUserResponses[poll.id]
                  return (
                    <div
                      key={poll.id}
                      className="w-full min-w-full max-w-full flex-shrink-0 snap-start"
                      style={{ minHeight: 160 }}
                    >
                      <div className={gradientCardOuter} style={gradientCardStyle}>
                        <button
                          type="button"
                          onClick={() => setActivePollId(poll.id)}
                          className={gradientCardInner}
                        >
                          <div className="flex shrink-0 items-start justify-between gap-2">
                            <h3 className="text-base sm:text-xl font-bold text-white leading-snug line-clamp-5 min-h-0 flex-1">
                              {poll.question || 'Poll'}
                            </h3>
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
                    </div>
                  )
                })}
                </div>
                {adminPollsCount >= 2 && (
                  <nav
                    className="flex justify-center gap-1.5"
                    role="tablist"
                    aria-label="Admin polls position"
                  >
                    {adminPollsWithFeatured.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        role="tab"
                        aria-selected={adminPollsActiveIndex === idx}
                        aria-label={`Poll ${idx + 1} of ${adminPollsCount}`}
                        onClick={() => {
                          const el = adminPollsScrollRef.current
                          if (el) {
                            const width = el.clientWidth
                            el.scrollTo({ left: width * idx, behavior: 'smooth' })
                          }
                        }}
                        className={`rounded-full transition-all ${
                          adminPollsActiveIndex === idx
                            ? 'w-2.5 h-2.5 bg-bright-teal'
                            : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </nav>
                )}
              </div>
            ) : (
              <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
                No admin polls yet.
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className={pollsSectionTitleClass}>Community polls</h2>
              {hasMoreCommunityPolls && communityPollsWithFeatured.length > 0 && (
                <button
                  type="button"
                  onClick={loadMoreCommunityPolls}
                  disabled={loadingMoreCommunityPolls}
                  className={pollsLoadMoreButtonClass}
                >
                  {loadingMoreCommunityPolls ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'load more...'
                  )}
                </button>
              )}
            </div>
            {communityPollsWithFeatured.length > 0 ? (
              <div className="flex flex-col gap-4">
                {communityPollsWithFeatured.map((poll) => (
                  <div
                    key={poll.id}
                    className="rounded-xl border border-white/20 bg-white/5 p-4"
                  >
                    <PollCard
                      poll={poll}
                      userResponse={mergedUserResponses[poll.id]}
                      voteCounts={mergedVoteCounts[poll.id] ?? {}}
                      onVote={() => router.refresh()}
                      variant="dark"
                      className="min-h-0 border-0 bg-transparent p-0 shadow-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/60">
                <span>No community polls yet. Add one!</span>
                <button
                  type="button"
                  onClick={() => setActiveModal('poll')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#25B4B1]/90"
                >
                  <Plus className="h-4 w-4" />
                  Create a poll
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="space-y-8 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {stories.length > 0 ? (
              stories.map((story) => (
                <div key={story.id} className="min-h-[200px] border border-white/20 bg-white/5 p-4 rounded-lg">
                  <FeaturedNewsCard newsStory={story} variant="spotlight" />
                </div>
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-white/60">No stories yet.</p>
            )}
          </div>
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
        </div>
      )}

      {activeTab === 'our-picks' && (
        <div className="space-y-8 pt-6">
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

          {featuredGrid && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Featured Fan Grid: {getGridTypeLabel(featuredGrid.type)}</h2>
              <FeaturedGridPostBlock
                grid={featuredGrid as FeaturedGridForBlock}
                user={featuredGrid.user}
                supabaseUrl={supabaseUrl}
              />
            </section>
          )}

          {sponsors.length === 0 && !featuredGrid && (
            <p className="py-8 text-center text-white/60">No picks this week. Check back soon.</p>
          )}
        </div>
      )}

      {activePollId && (() => {
        const poll = allPollsWithFeatured.find((p) => p.id === activePollId)
        if (!poll) return null
        return (
          <PollDiscussionModal
            poll={poll}
            userResponse={mergedUserResponses[poll.id]}
            voteCounts={mergedVoteCounts[poll.id] ?? {}}
            discussionPosts={pollDiscussionPostsByPollId[poll.id] ?? []}
            onClose={handleClosePollDiscussionModal}
          />
        )
      })()}
    </div>
  )
}
