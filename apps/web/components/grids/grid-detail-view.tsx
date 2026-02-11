'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getNationalityFlagPath } from '@/utils/flags'
import { getTeamBackgroundUrl } from '@/utils/storage-urls'
import { DriverHeroBodyMedia } from './hero/driver-hero-body-media'
import { TrackHeroMedia } from './hero/track-hero-media'
import { TeamHeroMedia } from './hero/team-hero-media'
import { GridBlurbCard } from './grid-blurb-card'
import { GridEditCanvas } from './grid-edit-canvas'
import { GridSlotCommentSection } from './grid-slot-comment-section'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getAvatarUrl } from '@/utils/avatar'

export type GridType = 'driver' | 'team' | 'track'

interface RankItemBase {
  id: string
  name: string
  is_placeholder?: boolean
  [key: string]: unknown
}

interface DriverRankItem extends RankItemBase {
  nationality?: string | null
  headshot_url?: string | null
  image_url?: string | null
  team_name?: string | null
}

interface TrackRankItem extends RankItemBase {
  location?: string | null
  country?: string | null
  track_slug?: string
}

interface TeamRankItem extends RankItemBase {}

export type RankItem = DriverRankItem | TrackRankItem | TeamRankItem

interface GridDetailViewProps {
  grid: {
    id: string
    type: GridType
    ranked_items: RankItem[]
    blurb?: string | null
    like_count?: number
    is_liked?: boolean
    /** Per-slot blurbs (rank 1-10). When absent, treat as empty or legacy grid.blurb for rank 1. */
    slotBlurbs?: Record<number, string>
  }
  owner: { id: string; username: string; profile_image_url: string | null }
  isOwnProfile: boolean
  supabaseUrl?: string
  mode: 'view' | 'edit'
  /** Edit mode: controlled ranked list and save handler; view mode ignores */
  rankedList?: RankItem[]
  onRankedListChange?: (items: RankItem[]) => void
  onSave?: () => void
  /** Edit mode: blurb and handlers for editing (legacy single blurb) */
  blurb?: string
  onBlurbChange?: (value: string) => void
  /** Edit mode: per-slot blurb change; when set, grid.slotBlurbs is used for current slot value */
  onSlotBlurbChange?: (rankIndex: number, value: string) => void
  /** Edit mode: full catalog for change-pick modal */
  availableItems?: RankItem[]
}

const VERTICAL_LABEL_SRC: Record<GridType, string> = {
  driver: '/images/drivers.svg',
  track: '/images/tracks.svg',
  team: '/images/teams.svg',
}

function OwnProfileBlurbBlock({
  owner,
  gridId,
  rankIndex,
  initialBlurb,
  ownBlurbDisplay,
  setOwnBlurbLocal,
  onSlotBlurbSaved,
  isEditingOwnBlurb,
  setIsEditingOwnBlurb,
  ownBlurbSaving,
  setOwnBlurbSaving,
}: {
  owner: { username: string; profile_image_url: string | null }
  gridId: string
  rankIndex: number
  initialBlurb: string
  ownBlurbDisplay: string
  setOwnBlurbLocal: (v: string | null) => void
  onSlotBlurbSaved?: (rankIndex: number, value: string) => void
  isEditingOwnBlurb: boolean
  setIsEditingOwnBlurb: (v: boolean) => void
  ownBlurbSaving: boolean
  setOwnBlurbSaving: (v: boolean) => void
}) {
  const supabase = createClientComponentClient()
  const [draft, setDraft] = useState(ownBlurbDisplay)

  useEffect(() => {
    setDraft(ownBlurbDisplay)
  }, [rankIndex, ownBlurbDisplay])

  async function handleSave() {
    const value = draft.trim().slice(0, 140)
    setOwnBlurbSaving(true)
    const { error } = await supabase
      .from('grid_slot_blurbs')
      .upsert(
        { grid_id: gridId, rank_index: rankIndex, content: value },
        { onConflict: 'grid_id,rank_index' }
      )
    setOwnBlurbSaving(false)
    if (!error) {
      setOwnBlurbLocal(value || null)
      onSlotBlurbSaved?.(rankIndex, value)
      setIsEditingOwnBlurb(false)
    }
  }

  const hasBlurb = ownBlurbDisplay.trim().length > 0
  const showInput = !hasBlurb || isEditingOwnBlurb

  return (
    <div className="mb-6 flex items-start gap-3">
      <Image
        src={getAvatarUrl(owner.profile_image_url)}
        alt={owner.username}
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{owner.username}</p>
        {showInput ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 140))}
              placeholder="Add a blurb about your ranking (max 140)..."
              rows={3}
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/60">{draft.length}/140</p>
            <button
              type="button"
              onClick={handleSave}
              disabled={ownBlurbSaving}
              className="mt-2 rounded-full bg-[#25B4B1] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {ownBlurbSaving ? 'Saving…' : 'Save blurb'}
            </button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-white/80 leading-snug">{ownBlurbDisplay}</p>
            <button
              type="button"
              onClick={() => {
                setDraft(ownBlurbDisplay)
                setIsEditingOwnBlurb(true)
              }}
              className="mt-1 text-xs text-[#25B4B1] hover:text-[#3BEFEB]"
            >
              Edit blurb
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function GridDetailView({
  grid,
  owner,
  isOwnProfile,
  supabaseUrl,
  mode,
  rankedList,
  onRankedListChange,
  onSave,
  blurb: blurbOverride,
  onBlurbChange,
  onSlotBlurbChange,
  availableItems,
}: GridDetailViewProps) {
  const items = mode === 'edit' && rankedList ? rankedList : grid.ranked_items
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedItem = items[selectedIndex]
  const type = grid.type
  const rankIndex = selectedIndex + 1
  const slotBlurbsFromProps = grid.slotBlurbs ?? {}
  const [slotBlurbsLocal, setSlotBlurbsLocal] = useState<Record<number, string> | null>(null)
  const currentSlotBlurbFromData =
    (slotBlurbsLocal ?? slotBlurbsFromProps)[rankIndex] ??
    (rankIndex === 1 ? (grid.blurb ?? '') : '')
  const isThirdPartyView = mode === 'view' && !isOwnProfile
  const isPlaceholderSelected = Boolean(selectedItem && selectedItem.is_placeholder)
  const doesHaveBlurb = Boolean(currentSlotBlurbFromData.trim().length > 0)
  const isBlurbEditable = mode === 'edit' && (Boolean(onBlurbChange) || Boolean(onSlotBlurbChange))
  const shouldShowBlurbPanel = isBlurbEditable || (doesHaveBlurb && !isThirdPartyView) || (isOwnProfile && mode === 'view')
  const isBlurbCollapsible = mode === 'view' && doesHaveBlurb && !isThirdPartyView
  const [isBlurbOpen, setIsBlurbOpen] = useState(true)
  const [ownBlurbLocal, setOwnBlurbLocal] = useState<string | null>(null)
  const [isEditingOwnBlurb, setIsEditingOwnBlurb] = useState(false)
  const [ownBlurbSaving, setOwnBlurbSaving] = useState(false)
  const ownBlurbDisplay = ownBlurbLocal !== null ? ownBlurbLocal : currentSlotBlurbFromData
  const [isEditingEditBlurb, setIsEditingEditBlurb] = useState(false)
  const [editBlurbDraft, setEditBlurbDraft] = useState('')

  useEffect(() => {
    setOwnBlurbLocal(null)
  }, [selectedIndex])

  useEffect(() => {
    if (mode === 'edit') {
      setIsEditingEditBlurb(false)
      setEditBlurbDraft((slotBlurbsFromProps ?? {})[rankIndex] ?? '')
    }
  }, [mode, selectedIndex, rankIndex])

  const heroBackground =
    type === 'team' && selectedItem
      ? supabaseUrl
        ? getTeamBackgroundUrl(selectedItem.name, supabaseUrl)
        : '/images/grid_bg.png'
      : '/images/grid_bg.png'

  const isDriverOrTrack = type === 'driver' || type === 'track'

  function handleSelectRankIndex(index: number) {
    setSelectedIndex(index)

    if (mode !== 'edit' || !availableItems || availableItems.length === 0) return

    const next = Array.from({ length: 10 }, (_, i) => {
      const current = items[i]
      return current ?? { id: `__placeholder__${i}`, name: '', is_placeholder: true }
    })

    const selected = next[index]
    if (selected?.is_placeholder) { /* Edit mode uses grid canvas; no modal */ }
  }

  // Desktop hero carousel (touch swipe for desktop view mode)
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  // Mobile horizontal slideshow: scroll container and slide refs
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (mode !== 'view' || !carouselRef.current) return
    const el = carouselRef.current
    const SWIPE_THRESHOLD = 50
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX
    }
    function onTouchEnd(e: TouchEvent) {
      const endX = e.changedTouches[0].clientX
      const deltaX = endX - touchStartX.current
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
      if (deltaX < 0) {
        setSelectedIndex((i) => Math.min(9, i + 1))
      } else {
        setSelectedIndex((i) => Math.max(0, i - 1))
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [mode])

  // Mobile: sync selectedIndex from scroll position
  useEffect(() => {
    const el = mobileScrollRef.current
    if (!el || mode !== 'view') return
    function onScroll() {
      const node = mobileScrollRef.current
      if (!node) return
      const width = node.clientWidth
      if (!width) return
      const idx = Math.round(node.scrollLeft / width)
      setSelectedIndex((i) => {
        const next = Math.min(Math.max(idx, 0), Math.max(0, items.length - 1))
        return next
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [mode, items.length])

  function scrollToIndex(idx: number) {
    const target = slideRefs.current[idx]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
      setSelectedIndex(idx)
      return
    }
    const el = mobileScrollRef.current
    if (el) {
      el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
      setSelectedIndex(idx)
    }
  }

  function getHeroBackgroundForItem(item: RankItem | undefined) {
    if (!item || item.is_placeholder) return '/images/grid_bg.png'
    if (type === 'team')
      return supabaseUrl ? getTeamBackgroundUrl(item.name, supabaseUrl) : '/images/grid_bg.png'
    return '/images/grid_bg.png'
  }

  function renderHeroSlot(item: RankItem | undefined, ghost: boolean) {
    if (!item || item.is_placeholder) return <div className="flex-1" aria-hidden />
    const opacity = ghost ? 'opacity-20 ' : 'opacity-100'
    const size = ghost ? 'min(50vw,160px)' : 'min(85vw,320px)'
    if (type === 'driver') {
      return (
        <div
          className={`flex items-end justify-center transition-all duration-300 ${opacity}`}
          style={{ minHeight: ghost ? 300 : 400 }}
        >
          <div
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: ghost ? 'min(120vw,300px)' : size,
              height: ghost ? 'min(120vw,300px)' : size,
              minWidth: ghost ? 80 : 400,
              minHeight: ghost ? 80 : 400,
            }}
          >
            <DriverHeroBodyMedia
              driverName={item.name}
              supabaseUrl={supabaseUrl}
              fallbackSrc={
                (item as DriverRankItem).headshot_url || (item as DriverRankItem).image_url
              }
              className="h-full w-full"
            />
          </div>
        </div>
      )
    }
    if (type === 'track') {
      return (
        <div
          className={`flex items-center justify-center transition-all duration-300 ${opacity}`}
          style={{ height: ghost ? 120 : 'min(60vh,420px)' }}
        >
          <TrackHeroMedia
            trackSlug={(item as TrackRankItem).track_slug ?? ''}
            trackName={item.name}
            supabaseUrl={supabaseUrl}
            className={ghost ? 'h-24 w-24 object-cover' : 'h-full w-full max-h-full'}
          />
        </div>
      )
    }
    if (type === 'team') {
      return (
        <div
          className={`flex items-end justify-center transition-all duration-300 ${opacity}`}
          style={{ height: ghost ? 120 : 'min(58vh,380px)' }}
        >
          <TeamHeroMedia
            teamId={item.id}
            teamName={item.name}
            supabaseUrl={supabaseUrl}
            className={ghost ? 'h-20 w-20 object-cover' : 'w-full h-[min(58vh,380px)] min-h-[220px]'}
          />
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top: edit mode = compact header + grid; view mode = hero */}
      {mode === 'edit' && onRankedListChange ? (
        <div className="px-4 pl-8 pt-20">
          <h1 className="text-3xl font-serif text-white font-normal font-display capitalize">
            Editing your grid
          </h1>
        </div>
      ) : mode === 'view' ? (
      <>
        {/* Desktop view: current layout (hero + bottom section) */}
        <div className="hidden lg:block">
          <div className="relative h-[60vh] flex flex-col overflow-hidden">
            {isDriverOrTrack ? (
              <div
                className="absolute inset-0 z-0"
                style={{
                  opacity: 0.5,
                  backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%), url(${heroBackground})`,
                  backgroundColor: 'lightgray',
                  backgroundPosition: '-0.213px 0px',
                  backgroundSize: '100.092% 106.904%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${heroBackground})` }}
                />
                <div className="absolute inset-0 z-0 bg-black/30" />
              </>
            )}
            <div
              ref={carouselRef}
              className="absolute inset-0 z-[1] flex items-end justify-center gap-2 touch-pan-y"
              style={{ touchAction: 'pan-y' }}
              role="region"
              aria-label="Grid ranking carousel - swipe left or right to change"
            >
              <div className="flex min-w-0 flex-1 items-end z-[-1]">
                {renderHeroSlot(items[selectedIndex - 1], true)}
              </div>
              <div className="flex flex-shrink-0 items-end justify-center" aria-current="true">
                {renderHeroSlot(selectedItem ?? undefined, false)}
              </div>
              <div className="flex min-w-0 flex-1 items-end justify-end z-[-1]">
                {renderHeroSlot(items[selectedIndex + 1], true)}
              </div>
            </div>
            <div className="absolute left-0 bottom-4 z-20 flex items-end pl-2 w-12" aria-hidden>
              <span className="block">
                <Image
                  src={VERTICAL_LABEL_SRC[type]}
                  alt=""
                  width={30}
                  height={120}
                  className="object-contain"
                  style={{ width: 120, height: 350 }}
                />
              </span>
            </div>
            <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 pt-16 pb-0 overflow-x-hidden">
              <div className="flex items-start justify-between gap-4 shrink-0 mb-4">
                <h1 className="text-3xl font-serif text-white font-normal font-display min-w-0 capitalize">
                  {owner.username}&apos;s <br /> Grid
                </h1>
                {isOwnProfile && (
                  <Link
                    href={`/profile/edit-grid/${type}`}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                    aria-label={`Edit ${type} grid`}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit</span>
                  </Link>
                )}
              </div>
              <div className="relative flex w-full gap-4 items-end min-h-0 flex-1">
                <div className="flex-1 min-w-0" />
                <div className="flex shrink-0 items-start self-stretch">
                  <span
                    className="font-bold font-display text-white"
                    style={{ fontSize: 'clamp(4rem, 13vw, 7rem)', lineHeight: 1 }}
                    aria-label={`Rank ${selectedIndex + 1} on this grid`}
                  >
                    {selectedIndex + 1}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-black px-4 py-6">
            {items.length > 0 && selectedItem && (
              <div className="mb-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                  disabled={selectedIndex === 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label={`Previous ${type}`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
                  <h2
                    key={selectedIndex}
                    className="text-2xl font-serif text-white font-normal font-display transition-opacity duration-200"
                  >
                    {isPlaceholderSelected
                      ? `Select a ${type === 'driver' ? 'driver' : type === 'team' ? 'team' : 'track'}`
                      : selectedItem.name}
                  </h2>
                  {(type === 'driver' && !isPlaceholderSelected && (selectedItem as DriverRankItem).nationality) ||
                  (type === 'track' && !isPlaceholderSelected && (selectedItem as TrackRankItem).country) ? (
                    <div className="mt-1 flex items-center justify-center gap-2">
                      {type === 'driver' && !isPlaceholderSelected && (selectedItem as DriverRankItem).nationality && (
                        <>
                          <Image
                            src={getNationalityFlagPath((selectedItem as DriverRankItem).nationality) ?? ''}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                          <span className="text-white/90 text-sm">
                            {(selectedItem as DriverRankItem).nationality}
                          </span>
                        </>
                      )}
                      {type === 'track' && !isPlaceholderSelected && (selectedItem as TrackRankItem).country && (
                        <span className="text-white/90 text-sm">
                          {(selectedItem as TrackRankItem).location &&
                            `${(selectedItem as TrackRankItem).location}, `}
                          {(selectedItem as TrackRankItem).country}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((i) => Math.min(items.length - 1, i + 1))}
                  disabled={selectedIndex >= items.length - 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label={`Next ${type}`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
            {isThirdPartyView && doesHaveBlurb && (
              <div className="mb-6 flex items-start gap-3">
                <Link href={`/u/${owner.username}`} className="flex-shrink-0">
                  <Image
                    src={getAvatarUrl(owner.profile_image_url)}
                    alt={owner.username}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${owner.username}`} className="text-sm font-medium text-white hover:text-white/90">
                    {owner.username}
                  </Link>
                  <p className="mt-1 text-sm text-white/80 leading-snug">{currentSlotBlurbFromData.trim()}</p>
                </div>
              </div>
            )}
            {isOwnProfile && (
              <OwnProfileBlurbBlock
                owner={owner}
                gridId={grid.id}
                rankIndex={rankIndex}
                initialBlurb={currentSlotBlurbFromData}
                ownBlurbDisplay={ownBlurbDisplay}
                setOwnBlurbLocal={setOwnBlurbLocal}
                onSlotBlurbSaved={(_, value) =>
                  setSlotBlurbsLocal((prev) => ({ ...(prev ?? {}), [rankIndex]: value }))
                }
                isEditingOwnBlurb={isEditingOwnBlurb}
                setIsEditingOwnBlurb={setIsEditingOwnBlurb}
                ownBlurbSaving={ownBlurbSaving}
                setOwnBlurbSaving={setOwnBlurbSaving}
              />
            )}
            {shouldShowBlurbPanel && <hr className="mb-6 border-white/20" />}
            <GridSlotCommentSection gridId={grid.id} rankIndex={selectedIndex + 1} />
          </div>
        </div>

        {/* Mobile view: swipable horizontal slideshow; static background + SVG; arrows with name in each slide */}
        <div className="lg:hidden flex flex-col min-h-screen relative">
          <div className="px-4 pt-16 pb-2 shrink-0 relative z-10">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-serif text-white font-normal font-display min-w-0 capitalize">
                {owner.username}&apos;s <br /> Grid
              </h1>
              {isOwnProfile && (
                <Link
                  href={`/profile/edit-grid/${type}`}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
                  aria-label={`Edit ${type} grid`}
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </Link>
              )}
            </div>
          </div>
          {/* Static background and vertical label (drivers/teams/tracks) behind scroll */}
          <div className="absolute inset-0 top-0 left-0 right-0 z-0 pointer-events-none" aria-hidden>
            {isDriverOrTrack ? (
              <div
                className="absolute inset-0"
                style={{
                  opacity: 0.5,
                  backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%), url(${heroBackground})`,
                  backgroundColor: 'lightgray',
                  backgroundPosition: '-0.213px 0px',
                  backgroundSize: '100.092% 106.904%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${heroBackground})` }}
                />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}
            <div className="absolute left-0 bottom-4 flex items-end pl-2 w-12">
              <Image
                src={VERTICAL_LABEL_SRC[type]}
                alt=""
                width={30}
                height={120}
                className="object-contain"
                style={{ width: 120, height: 350 }}
              />
            </div>
          </div>
          <div
            ref={mobileScrollRef}
            className="flex-1 w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory relative z-10"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            role="region"
            aria-label="Grid ranking - swipe left or right"
          >
            <div className="flex w-full h-full min-h-0">
              {items.map((item, idx) => {
                const slideRankIndex = idx + 1
                const slideItem = item
                const slideBlurb =
                  (slotBlurbsLocal ?? slotBlurbsFromProps)[slideRankIndex] ??
                  (slideRankIndex === 1 ? (grid.blurb ?? '') : '')
                const slideHasBlurb = Boolean(slideBlurb.trim().length > 0)
                const isPlaceholder = Boolean(slideItem?.is_placeholder)
                return (
                  <div
                    key={idx}
                    ref={(el) => {
                      slideRefs.current[idx] = el
                    }}
                    className="w-full min-w-full flex-shrink-0 snap-start flex flex-col overflow-y-auto"
                  >
                    <div className="relative flex flex-col min-h-[45vh] flex-shrink-0 bg-transparent">
                      <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 pt-4 pb-2">
                        <div className="relative flex w-full gap-4 items-end min-h-0 flex-1">
                          <div className="flex-1 min-w-0" />
                          <div className="flex shrink-0 items-start self-stretch">
                            <span
                              className="font-bold font-display text-white"
                              style={{ fontSize: 'clamp(4rem, 13vw, 7rem)', lineHeight: 1 }}
                              aria-label={`Rank ${slideRankIndex} on this grid`}
                            >
                              {slideRankIndex}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-end justify-center pb-2">
                        {renderHeroSlot(slideItem ?? undefined, false)}
                      </div>
                    </div>
                    <div className="px-4 py-4 bg-black flex-1">
                      <div className="mb-6 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => scrollToIndex(Math.max(0, idx - 1))}
                          disabled={idx === 0}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          aria-label={`Previous ${type}`}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
                          <h2 className="text-2xl font-serif text-white font-normal font-display">
                            {isPlaceholder
                              ? `Select a ${type === 'driver' ? 'driver' : type === 'team' ? 'team' : 'track'}`
                              : (slideItem?.name ?? '')}
                          </h2>
                          {(type === 'driver' && !isPlaceholder && (slideItem as DriverRankItem)?.nationality) ||
                          (type === 'track' && !isPlaceholder && (slideItem as TrackRankItem)?.country) ? (
                            <div className="mt-1 flex items-center justify-center gap-2">
                              {type === 'driver' && !isPlaceholder && (slideItem as DriverRankItem)?.nationality && (
                                <>
                                  <Image
                                    src={getNationalityFlagPath((slideItem as DriverRankItem).nationality) ?? ''}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="rounded-full object-cover"
                                  />
                                  <span className="text-white/90 text-sm">
                                    {(slideItem as DriverRankItem).nationality}
                                  </span>
                                </>
                              )}
                              {type === 'track' && !isPlaceholder && (slideItem as TrackRankItem)?.country && (
                                <span className="text-white/90 text-sm">
                                  {(slideItem as TrackRankItem).location &&
                                    `${(slideItem as TrackRankItem).location}, `}
                                  {(slideItem as TrackRankItem).country}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => scrollToIndex(Math.min(items.length - 1, idx + 1))}
                          disabled={idx >= items.length - 1}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          aria-label={`Next ${type}`}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </div>
                      {isThirdPartyView && slideHasBlurb && (
                        <div className="mb-6 flex items-start gap-3">
                          <Link href={`/u/${owner.username}`} className="flex-shrink-0">
                            <Image
                              src={getAvatarUrl(owner.profile_image_url)}
                              alt={owner.username}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link href={`/u/${owner.username}`} className="text-sm font-medium text-white hover:text-white/90">
                              {owner.username}
                            </Link>
                            <p className="mt-1 text-sm text-white/80 leading-snug">{slideBlurb.trim()}</p>
                          </div>
                        </div>
                      )}
                      {isOwnProfile && (
                        <OwnProfileBlurbBlock
                          owner={owner}
                          gridId={grid.id}
                          rankIndex={slideRankIndex}
                          initialBlurb={slideBlurb}
                          ownBlurbDisplay={
                            selectedIndex === idx && ownBlurbLocal !== null ? ownBlurbLocal : slideBlurb
                          }
                          setOwnBlurbLocal={setOwnBlurbLocal}
                          onSlotBlurbSaved={(_, value) =>
                            setSlotBlurbsLocal((prev) => ({ ...(prev ?? {}), [slideRankIndex]: value }))
                          }
                          isEditingOwnBlurb={selectedIndex === idx && isEditingOwnBlurb}
                          setIsEditingOwnBlurb={setIsEditingOwnBlurb}
                          ownBlurbSaving={ownBlurbSaving}
                          setOwnBlurbSaving={setOwnBlurbSaving}
                        />
                      )}
                      {(slideHasBlurb || isOwnProfile) && <hr className="mb-6 border-white/20" />}
                      <GridSlotCommentSection gridId={grid.id} rankIndex={slideRankIndex} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </>
      ) : (
      <>
        <div className="relative h-[60vh] flex flex-col overflow-hidden">
          {isDriverOrTrack ? (
            <div
              className="absolute inset-0 z-0"
              style={{
                opacity: 0.5,
                backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%), url(${heroBackground})`,
                backgroundColor: 'lightgray',
                backgroundPosition: '-0.213px 0px',
                backgroundSize: '100.092% 106.904%',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ) : (
            <>
              <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroBackground})` }}
              />
              <div className="absolute inset-0 z-0 bg-black/30" />
            </>
          )}
          <div className="absolute inset-0 z-[1] flex items-end justify-center pointer-events-none">
            {selectedItem && !isPlaceholderSelected && type === 'driver' && (
              <div
                key={selectedIndex}
                className="transition-all duration-300 h-[min(85vw,320px)] w-[min(85vw,320px)] min-h-[200px] min-w-[200px] mb-2"
              >
                <DriverHeroBodyMedia
                  driverName={selectedItem.name}
                  supabaseUrl={supabaseUrl}
                  fallbackSrc={
                    (selectedItem as DriverRankItem).headshot_url ||
                    (selectedItem as DriverRankItem).image_url
                  }
                  className="h-full w-full"
                />
              </div>
            )}
            {selectedItem && !isPlaceholderSelected && type === 'track' && (
              <div
                key={selectedIndex}
                className="transition-all duration-300 flex items-center justify-center h-[min(60vh,420px)] w-full max-w-[min(100vw,420px)]"
              >
                <TrackHeroMedia
                  trackSlug={(selectedItem as TrackRankItem).track_slug ?? ''}
                  trackName={selectedItem.name}
                  supabaseUrl={supabaseUrl}
                  className="h-full w-full max-h-full"
                />
              </div>
            )}
            {selectedItem && !isPlaceholderSelected && type === 'team' && (
              <div
                key={selectedIndex}
                className="transition-all duration-300 absolute inset-0 flex items-end justify-center min-h-0"
              >
                <TeamHeroMedia
                  teamId={selectedItem.id}
                  teamName={selectedItem.name}
                  supabaseUrl={supabaseUrl}
                  className="w-full h-[min(58vh,380px)] min-h-[220px]"
                />
              </div>
            )}
          </div>
          <div className="absolute left-0 bottom-4 z-20 flex items-end pl-2 w-12" aria-hidden>
            <span className="block">
              <Image
                src={VERTICAL_LABEL_SRC[type]}
                alt=""
                width={30}
                height={120}
                className="object-contain"
                style={{ width: 120, height: 350 }}
              />
            </span>
          </div>
          <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 pt-16 pb-0 overflow-x-hidden">
            <div className="flex items-start justify-between gap-4 shrink-0 mb-4">
              <h1 className="text-3xl font-serif text-white font-normal font-display min-w-0 capitalize">
                {owner.username}&apos;s <br /> Grid
              </h1>
            </div>
            <div className="relative flex w-full gap-4 items-end min-h-0 flex-1">
              <div className="flex-1 min-w-0" />
              <div className="flex shrink-0 items-start self-stretch">
                <span
                  className="font-bold font-display text-white"
                  style={{ fontSize: 'clamp(4rem, 13vw, 7rem)', lineHeight: 1 }}
                  aria-label={`Rank ${selectedIndex + 1} on this grid`}
                >
                  {selectedIndex + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
      )}

      {/* Bottom half: edit mode only — grid + tray first, then name/arrows, comments, blurb, save */}
      {mode === 'edit' && (
      <div className="bg-black px-4 pl-8 py-6">
        {onRankedListChange && rankedList && availableItems && (
          <>
            <GridEditCanvas
              type={type}
              rankedList={items}
              onRankedListChange={onRankedListChange}
              availableItems={availableItems}
              supabaseUrl={supabaseUrl}
              activeSlotIndex={selectedIndex}
            />
            {items.length > 0 && selectedItem && (
              <div className="mt-8 mb-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                  disabled={selectedIndex === 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label={`Previous ${type}`}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
                  <h2
                    key={selectedIndex}
                    className="text-2xl font-serif text-white font-normal font-display transition-opacity duration-200"
                  >
                    {isPlaceholderSelected
                      ? `Select a ${type === 'driver' ? 'driver' : type === 'team' ? 'team' : 'track'}`
                      : selectedItem.name}
                  </h2>
                  {(type === 'driver' && !isPlaceholderSelected && (selectedItem as DriverRankItem).nationality) ||
                  (type === 'track' && !isPlaceholderSelected && (selectedItem as TrackRankItem).country) ? (
                    <div className="mt-1 flex items-center justify-center gap-2">
                      {type === 'driver' && !isPlaceholderSelected && (selectedItem as DriverRankItem).nationality && (
                        <>
                          <Image
                            src={getNationalityFlagPath((selectedItem as DriverRankItem).nationality) ?? ''}
                            alt=""
                            width={24}
                            height={24}
                            className="rounded-full object-cover"
                          />
                          <span className="text-white/90 text-sm">
                            {(selectedItem as DriverRankItem).nationality}
                          </span>
                        </>
                      )}
                      {type === 'track' && !isPlaceholderSelected && (selectedItem as TrackRankItem).country && (
                        <span className="text-white/90 text-sm">
                          {(selectedItem as TrackRankItem).location &&
                            `${(selectedItem as TrackRankItem).location}, `}
                          {(selectedItem as TrackRankItem).country}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIndex((i) => Math.min(items.length - 1, i + 1))}
                  disabled={selectedIndex >= items.length - 1}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label={`Next ${type}`}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}

            {onSlotBlurbChange && (
              <div className="mb-6 mt-12">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Blurb for rank {rankIndex} (optional, max 140)
                </label>
                {isEditingEditBlurb ? (
                  <div>
                    <textarea
                      value={editBlurbDraft}
                      onChange={(e) => setEditBlurbDraft(e.target.value.slice(0, 140))}
                      placeholder="Add a blurb for this spot..."
                      rows={3}
                      className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none"
                      autoFocus
                    />
                    <p className="mt-1 text-xs text-white/60">{editBlurbDraft.length}/140</p>
                    <button
                      type="button"
                      onClick={() => {
                        onSlotBlurbChange(rankIndex, editBlurbDraft)
                        setIsEditingEditBlurb(false)
                      }}
                      className="mt-2 text-sm text-[#25B4B1] hover:text-[#3BEFEB]"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditBlurbDraft((slotBlurbsFromProps ?? {})[rankIndex] ?? '')
                      setIsEditingEditBlurb(true)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-white/20 bg-white/5 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {((slotBlurbsFromProps ?? {})[rankIndex] ?? '').trim()
                        ? (slotBlurbsFromProps ?? {})[rankIndex]
                        : 'Add a blurb for this spot...'}
                    </span>
                    <Pencil className="h-4 w-4 shrink-0 text-white/60" aria-hidden />
                  </button>
                )}
              </div>
            )}

            {onSave && (
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="rounded-full border border-white/30 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={items.filter((i) => !i.is_placeholder).length === 0}
                  className="rounded-full bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Save Grid
                </button>
              </div>
            )}
          </>
        )}
      </div>
      )}
    </div>
  )
}
