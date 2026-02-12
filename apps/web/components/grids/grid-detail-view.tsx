'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

function GridStepperBar({
  currentIndex,
  total,
  onSelectIndex,
  ariaLabel = 'Grid position',
}: {
  currentIndex: number
  total: number
  onSelectIndex: (index: number, options?: { isDragging?: boolean }) => void
  ariaLabel?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(0)
  const didDragRef = useRef(false)

  if (total <= 0) return null
  const segmentWidth = 100 / total
  const leftPercent = currentIndex * segmentWidth

  function positionToIndex(clientX: number): number {
    const el = trackRef.current
    if (!el) return currentIndex
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = (x / rect.width) * 100
    return Math.min(total - 1, Math.max(0, Math.floor((percent / 100) * total)))
  }

  function positionToBarLeft(clientX: number): number {
    const el = trackRef.current
    if (!el) return leftPercent
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = (x / rect.width) * 100
    const centered = percent - segmentWidth / 2
    return Math.min(100 - segmentWidth, Math.max(0, centered))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onSelectIndex(Math.max(0, currentIndex - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onSelectIndex(Math.min(total - 1, currentIndex + 1))
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const index = Math.min(total - 1, Math.max(0, Math.floor((x / rect.width) * total)))
    onSelectIndex(index)
  }

  function handleTouchStart(e: React.TouchEvent) {
    setIsDragging(true)
    didDragRef.current = false
    const rect = trackRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.touches[0].clientX - rect.left
      const percent = (x / rect.width) * 100
      setDragPosition(Math.min(100 - segmentWidth, Math.max(0, percent - segmentWidth / 2)))
    }
    e.stopPropagation()
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return
    didDragRef.current = true
    e.preventDefault()
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches[0].clientX
    const index = positionToIndex(clientX)
    const barLeft = positionToBarLeft(clientX)
    setDragPosition(barLeft)
    onSelectIndex(index, { isDragging: true })
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isDragging) return
    const clientX = e.changedTouches[0].clientX
    const index = positionToIndex(clientX)
    setIsDragging(false)
    onSelectIndex(index)
    e.stopPropagation()
  }

  function handleTouchCancel() {
    if (isDragging) {
      setIsDragging(false)
      onSelectIndex(currentIndex)
    }
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    setIsDragging(true)
    didDragRef.current = false
    const rect = trackRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const percent = (x / rect.width) * 100
      setDragPosition(Math.min(100 - segmentWidth, Math.max(0, percent - segmentWidth / 2)))
    }

    function onMouseMove(ev: MouseEvent) {
      didDragRef.current = true
      const index = positionToIndex(ev.clientX)
      const barLeft = positionToBarLeft(ev.clientX)
      setDragPosition(barLeft)
      onSelectIndex(index, { isDragging: true })
    }

    function onMouseUp(ev: MouseEvent) {
      if (ev.button !== 0) return
      const index = positionToIndex(ev.clientX)
      setIsDragging(false)
      onSelectIndex(index)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const barLeft = isDragging ? dragPosition : leftPercent
  const barTransition = isDragging ? 'none' : 'left 200ms ease-out'

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={total - 1}
      aria-valuenow={currentIndex}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="w-full relative h-2 flex items-center cursor-pointer select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="w-full h-0.5 rounded-full bg-white/30 pointer-events-none" aria-hidden />
      <div
        className="absolute top-1/2 -translate-y-1/2 h-2 rounded-sm bg-white/80 pointer-events-none"
        style={{
          width: `${segmentWidth}%`,
          left: `${barLeft}%`,
          transition: barTransition,
        }}
        aria-hidden
      />
    </div>
  )
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
  readOnly = false,
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
  readOnly?: boolean
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

  if (readOnly) {
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
          <p className="mt-1 text-sm text-white/80 leading-snug">{ownBlurbDisplay}</p>
        </div>
      </div>
    )
  }

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

function GridHeroBackground({
  heroBackground,
  isDriverOrTrack,
}: {
  heroBackground: string
  isDriverOrTrack: boolean
}) {
  if (isDriverOrTrack) {
    return (
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
    )
  }
  return (
    <>
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/30" />
    </>
  )
}

function GridVerticalLabel({ type }: { type: GridType }) {
  return (
    <Image
      src={VERTICAL_LABEL_SRC[type]}
      alt=""
      width={30}
      height={120}
      className="object-contain"
      style={{ width: 'clamp(92px, 28vw, 120px)', height: 'clamp(260px, 78vw, 350px)' }}
    />
  )
}

function GridHeroHeader({
  username,
  type,
  showEditLink,
}: {
  username: string
  type: GridType
  showEditLink: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h1
        className="font-serif text-white font-normal font-display min-w-0 capitalize"
        style={{ fontSize: 'clamp(1.375rem, 6vw, 1.875rem)' }}
      >
        {username}&apos;s <br /> Grid
      </h1>
      {showEditLink && (
        <Link
          href={`/profile/edit-grid/${type}`}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2 py-2 lg:px-3 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          aria-label={`Edit ${type} grid`}
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden lg:inline">Edit</span>
        </Link>
      )}
    </div>
  )
}

function GridNameNationality({
  selectedItem,
  type,
  isPlaceholderSelected,
  selectedIndex,
  variant = 'view',
}: {
  selectedItem: RankItem | undefined
  type: GridType
  isPlaceholderSelected: boolean
  selectedIndex: number
  variant?: 'view' | 'edit'
}) {
  const typeLabel = type === 'driver' ? 'driver' : type === 'team' ? 'team' : 'track'
  const titleClass =
    variant === 'edit'
      ? 'text-xl font-serif text-white font-normal font-display transition-opacity duration-200'
      : 'font-serif text-white font-normal font-display transition-opacity duration-200'
  const titleStyle = variant === 'view' ? { fontSize: 'clamp(1.125rem, 5.5vw, 1.5rem)' } : undefined

  return (
    <div
      className={
        variant === 'edit'
          ? 'flex flex-col items-center justify-center text-center'
          : 'mb-6 flex flex-col items-center justify-center text-center'
      }
    >
      <h2
        key={selectedIndex}
        className={titleClass}
        style={variant === 'view' ? titleStyle : undefined}
      >
        {isPlaceholderSelected ? `Select a ${typeLabel}` : selectedItem?.name ?? ''}
      </h2>
      {(type === 'driver' &&
        !isPlaceholderSelected &&
        selectedItem &&
        (selectedItem as DriverRankItem).team_name) ||
      (type === 'track' &&
        !isPlaceholderSelected &&
        selectedItem &&
        (selectedItem as TrackRankItem).country) ? (
        <div className="flex items-center justify-center gap-1">
          {type === 'driver' &&
            !isPlaceholderSelected &&
            selectedItem &&
            (selectedItem as DriverRankItem).team_name && (
              <span className="text-white/90 text-sm tracking-wider [font-variant:all-small-caps;]">
                {(selectedItem as DriverRankItem).team_name}
              </span>
            )}
          {type === 'track' &&
            !isPlaceholderSelected &&
            selectedItem &&
            (selectedItem as TrackRankItem).country && (
              <span className="text-white/90 text-sm">
                {(selectedItem as TrackRankItem).location &&
                  `${(selectedItem as TrackRankItem).location}, `}
                {(selectedItem as TrackRankItem).country}
              </span>
            )}
        </div>
      ) : null}
    </div>
  )
}

function GridBlurbDisplay({
  isThirdPartyView,
  doesHaveBlurb,
  currentSlotBlurbFromData,
  owner,
  gridId,
  rankIndex,
  ownBlurbDisplay,
  setOwnBlurbLocal,
  onSlotBlurbSaved,
  isEditingOwnBlurb,
  setIsEditingOwnBlurb,
  ownBlurbSaving,
  setOwnBlurbSaving,
  readOnly,
}: {
  isThirdPartyView: boolean
  doesHaveBlurb: boolean
  currentSlotBlurbFromData: string
  owner: { username: string; profile_image_url: string | null }
  gridId: string
  rankIndex: number
  ownBlurbDisplay: string
  setOwnBlurbLocal: (v: string | null) => void
  onSlotBlurbSaved?: (rankIndex: number, value: string) => void
  isEditingOwnBlurb: boolean
  setIsEditingOwnBlurb: (v: boolean) => void
  ownBlurbSaving: boolean
  setOwnBlurbSaving: (v: boolean) => void
  readOnly: boolean
}) {
  if (isThirdPartyView && doesHaveBlurb) {
    return (
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
    )
  }
  if (readOnly && doesHaveBlurb) {
    return (
      <OwnProfileBlurbBlock
        owner={owner}
        gridId={gridId}
        rankIndex={rankIndex}
        initialBlurb={currentSlotBlurbFromData}
        ownBlurbDisplay={ownBlurbDisplay}
        setOwnBlurbLocal={setOwnBlurbLocal}
        onSlotBlurbSaved={onSlotBlurbSaved}
        isEditingOwnBlurb={isEditingOwnBlurb}
        setIsEditingOwnBlurb={setIsEditingOwnBlurb}
        ownBlurbSaving={ownBlurbSaving}
        setOwnBlurbSaving={setOwnBlurbSaving}
        readOnly
      />
    )
  }
  return null
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
  const shouldShowBlurbPanel = isBlurbEditable || (doesHaveBlurb && !isThirdPartyView)
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

  // Single scroll container for hero (view mode: mobile swipe + desktop chevrons)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  // Sync selectedIndex from scroll position (view mode)
  useEffect(() => {
    const el = mobileScrollRef.current
    if (!el || mode !== 'view') return
    function syncIndexFromScroll() {
      const node = mobileScrollRef.current
      if (!node) return
      const width = node.clientWidth
      if (!width) return
      const idx = Math.round(node.scrollLeft / width)
      const next = Math.min(Math.max(idx, 0), Math.max(0, items.length - 1))
      setSelectedIndex((i) => (i === next ? i : next))
    }
    el.addEventListener('scroll', syncIndexFromScroll, { passive: true })
    el.addEventListener('scrollend', syncIndexFromScroll)
    // Sync once after layout so the number matches initial scroll position
    const raf = requestAnimationFrame(() => syncIndexFromScroll())
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', syncIndexFromScroll)
      el.removeEventListener('scrollend', syncIndexFromScroll)
    }
  }, [mode, items.length])

  function scrollToIndex(
    idx: number,
    options?: { isDragging?: boolean }
  ) {
    setSelectedIndex(idx)
    const el = mobileScrollRef.current
    if (el) {
      el.scrollTo({
        left: idx * el.clientWidth,
        behavior: options?.isDragging ? 'auto' : 'smooth',
      })
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
    // Scales for 320px: 90vw=288, max 320; min 220 on small mobile
    const size = ghost ? 'min(50vw,160px)' : 'min(90vw,320px)'
    const minDim = ghost ? 80 : 220
    const maxDim = ghost ? 300 : 320
    if (type === 'driver') {
      return (
        <div
          className={`flex items-end justify-center transition-all duration-300 ${opacity}`}
          style={{ minHeight: ghost ? 300 : 'min(35vh, 280px)' }}
        >
          <div
            className="flex-shrink-0 transition-all duration-300"
            style={{
              width: ghost ? 'min(120vw,300px)' : `clamp(${minDim}px, 90vw, ${maxDim}px)`,
              height: ghost ? 'min(120vw,300px)' : `clamp(${minDim}px, 90vw, ${maxDim}px)`,
              minWidth: ghost ? 80 : minDim,
              minHeight: ghost ? 80 : minDim,
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

  const showUnifiedHero = mode === 'view' || (mode === 'edit' && !onRankedListChange)

  return (
    <div className="min-h-screen bg-black text-white">
      {mode === 'edit' && onRankedListChange && (
        <div className="px-4 pl-8 pt-20">
          <h1 className="text-3xl font-serif text-white font-normal font-display capitalize">
            Editing your grid
          </h1>
        </div>
        
      )}
  {mode === 'edit' && items.length > 0 && selectedItem && (
        <div className="px-4 pl-8 mt-8 mb-6 flex flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setSelectedIndex(Math.max(0, selectedIndex - 1))
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
            disabled={selectedIndex === 0}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label={`Previous ${type}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
            <GridNameNationality
              selectedItem={selectedItem}
              type={type}
              isPlaceholderSelected={isPlaceholderSelected}
              selectedIndex={selectedIndex}
              variant="edit"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1))
              ;(e.currentTarget as HTMLButtonElement).blur()
            }}
            disabled={selectedIndex >= items.length - 1}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label={`Next ${type}`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
      {showUnifiedHero && (
        <div className="flex flex-col min-h-screen relative">
          {/* Header: fixed above hero on mobile, in-hero on desktop */}
          <div className="px-4 pt-14 lg:pt-16 shrink-0 relative z-10">
            <GridHeroHeader
              username={owner.username}
              type={type}
              showEditLink={isOwnProfile}
            />
          </div>
          {/* Background + vertical label: behind hero */}
          <div className="absolute inset-0 top-0 left-0 right-0 z-0 pointer-events-none" aria-hidden>
            <GridHeroBackground heroBackground={heroBackground} isDriverOrTrack={isDriverOrTrack} />
            <div className="absolute left-0 top-[10vh] lg:top-auto lg:bottom-4 flex items-end pl-2 w-12">
              <GridVerticalLabel type={type} />
            </div>
            <div className="absolute left-0 right-0 bottom-0 top-[65vh] lg:top-[60vh] bg-black z-0" />
          </div>
          {/* Hero wrapper: relative so rank number can sit bottom-right on desktop */}
          <div className="relative h-[35vh] lg:h-[60vh] shrink-0 z-10">
            {/* Rank number: fixed on mobile, absolute in hero on desktop */}
            <div
              className="fixed right-4 top-44 z-10 pointer-events-none flex items-end justify-end px-2 sm:right-8 sm:top-52 sm:px-4 opacity-65 lg:absolute lg:right-4 lg:top-auto lg:bottom-4 lg:opacity-100"
              style={{ fontSize: 'clamp(5rem, 25vw, 10rem)', lineHeight: 1 }}
              aria-label={`Rank ${selectedIndex + 1} on this grid`}
            >
              <span
                key={selectedIndex}
                className="font-bold font-display text-white animate-rank-number-fade"
              >
                {selectedIndex + 1}
              </span>
            </div>
            {/* Single hero scroll container: swipe on mobile, programmatic on desktop */}
            <div
              ref={mobileScrollRef}
              className="h-[35vh] lg:h-[60vh] w-full overflow-x-auto lg:overflow-x-hidden overflow-y-hidden snap-x snap-mandatory relative"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            role="region"
            aria-label="Grid ranking - swipe left or right"
          >
            <div className="flex h-full min-h-0">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    slideRefs.current[idx] = el
                  }}
                  className="w-full min-w-full flex-shrink-0 snap-start flex items-end justify-center h-full"
                >
                  {renderHeroSlot(item ?? undefined, false)}
                </div>
              ))}
            </div>
            </div>
          </div>
          {/* Stepper: mobile only */}
          {items.length > 0 && (
            <div className="shrink-0 bg-black px-4 py-3 relative z-10 lg:hidden">
              <GridStepperBar
                currentIndex={selectedIndex}
                total={items.length}
                onSelectIndex={(i, opts) => scrollToIndex(i, opts)}
                ariaLabel={`Grid position ${selectedIndex + 1} of ${items.length}`}
              />
            </div>
          )}
          {/* Content: name, blurb, comments — only when view mode */}
          {mode === 'view' && (
            <div className="flex-1 min-h-0 overflow-y-auto bg-black relative z-10 px-4 pt-4 pb-6">
              {/* Chevrons (desktop only) + name/nationality (both) */}
              {items.length > 0 && selectedItem && (
                <div className="mb-6 flex flex-col lg:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToIndex(Math.max(0, selectedIndex - 1))
                      ;(e.currentTarget as HTMLButtonElement).blur()
                    }}
                    disabled={selectedIndex === 0}
                    className="hidden lg:flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label={`Previous ${type}`}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
                    <GridNameNationality
                      selectedItem={selectedItem}
                      type={type}
                      isPlaceholderSelected={isPlaceholderSelected}
                      selectedIndex={selectedIndex}
                      variant="view"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToIndex(Math.min(items.length - 1, selectedIndex + 1))
                      ;(e.currentTarget as HTMLButtonElement).blur()
                    }}
                    disabled={selectedIndex >= items.length - 1}
                    className="hidden lg:flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label={`Next ${type}`}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}
              <GridBlurbDisplay
                isThirdPartyView={isThirdPartyView}
                doesHaveBlurb={doesHaveBlurb}
                currentSlotBlurbFromData={currentSlotBlurbFromData}
                owner={owner}
                gridId={grid.id}
                rankIndex={rankIndex}
                ownBlurbDisplay={ownBlurbDisplay}
                setOwnBlurbLocal={setOwnBlurbLocal}
                onSlotBlurbSaved={(_, value) =>
                  setSlotBlurbsLocal((prev) => ({ ...(prev ?? {}), [rankIndex]: value }))
                }
                isEditingOwnBlurb={isEditingOwnBlurb}
                setIsEditingOwnBlurb={setIsEditingOwnBlurb}
                ownBlurbSaving={ownBlurbSaving}
                setOwnBlurbSaving={setOwnBlurbSaving}
                readOnly
              />
              {shouldShowBlurbPanel && <hr className="mb-6 border-white/20" />}
              <GridSlotCommentSection gridId={grid.id} rankIndex={rankIndex} />
            </div>
          )}
        </div>
      )}

      {/* Edit mode: canvas + name, stepper, blurb, save */}
      {mode === 'edit' && (
      <div className="bg-black px-3 py-6">
        {onRankedListChange && rankedList && availableItems && (
          <>
            <GridEditCanvas
              type={type}
              rankedList={items}
              onRankedListChange={onRankedListChange}
              availableItems={availableItems}
              supabaseUrl={supabaseUrl}
              activeSlotIndex={selectedIndex}
              onActiveSlotChange={setSelectedIndex}
            />

            {onSlotBlurbChange && (
              <div className="mb-6 mt-12">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Your comment for: <span className="font-bold pl-2 font-display"> {rankIndex} - {selectedItem?.name}</span>
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
