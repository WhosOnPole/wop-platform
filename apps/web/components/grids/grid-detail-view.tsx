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
import { GridRankPillsDnd } from './grid-rank-pills-dnd'
import { GridItemPickerModal } from './grid-item-picker-modal'
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

function DragHint() {
  return (
    <div className="flex items-center justify-center gap-2 mt-4 text-white/70 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="17" viewBox="0 0 13 17" fill="none" className="flex-shrink-0">
        <g clipPath="url(#clip0_grid_drag)">
          <path d="M12.9782 12.2254C12.9704 13.7415 12.1772 15.009 11.1675 15.8446C9.49854 17.2259 7.31616 17.3506 5.49453 16.3133C4.74733 15.8877 4.19258 15.2869 3.70016 14.5257L0.342833 9.33624C-0.143352 8.58507 -0.12777 7.60919 0.486974 6.97174C1.0277 6.41043 1.98605 6.41593 2.47768 7.17627L3.99156 9.51784L3.9939 1.70986C3.9939 0.782587 4.55254 0.0681008 5.30753 0.00481515C6.01655 -0.0548018 6.78557 0.597316 6.79024 1.53009L6.80894 5.23001C7.24838 4.94293 7.61769 4.86039 8.05245 5.04015C8.37658 5.17406 8.65862 5.58863 8.84406 5.9821C9.22117 5.73538 9.65593 5.56937 10.0993 5.75739C10.4507 5.90598 10.7421 6.32421 10.922 6.76996C11.3591 6.46179 11.8516 6.3398 12.3105 6.63147C12.6837 6.8681 13.0031 7.34045 13 7.94763L12.9782 12.2272V12.2254ZM10.6688 8.25397C10.5901 8.24296 10.4538 8.0531 10.4522 7.94763L10.4429 7.13867C10.4366 6.61588 10.051 6.24442 9.65827 6.25084C8.6781 6.26735 9.03261 7.58442 8.58383 7.46244C8.50046 7.43951 8.38203 7.24415 8.38203 7.13592V6.4783C8.38437 5.8968 8.00414 5.50883 7.55536 5.52259C6.64454 5.55102 6.96087 6.7984 6.53936 6.73878C6.45365 6.72685 6.3212 6.51865 6.32042 6.40034L6.31107 1.56128C6.30951 0.933005 5.75632 0.523941 5.30364 0.582641C4.82602 0.644092 4.48398 1.09259 4.48398 1.71261L4.48631 10.3286C4.48631 10.435 4.40217 10.6304 4.33594 10.6652C4.26971 10.7001 4.08895 10.6341 4.04376 10.5634L2.13486 7.57984C1.82944 7.1029 1.29728 7.02769 0.912386 7.31202C0.550085 7.58075 0.298422 8.2769 0.604625 8.75016L4.54475 14.8375C6.34379 16.8021 9.14559 16.9764 11.0864 15.197C11.889 14.4615 12.492 13.3792 12.4967 12.1731L12.5123 7.94212C12.5146 7.39548 12.1001 7.01026 11.6879 7.04053C10.7436 7.11024 11.1067 8.3145 10.668 8.25305L10.6688 8.25397Z" fill="white"/>
        </g>
        <defs>
          <clipPath id="clip0_grid_drag">
            <rect width="13" height="17" fill="white"/>
          </clipPath>
        </defs>
      </svg>
      <span>drag and drop into their positions on your grid</span>
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
  const [pickerOpen, setPickerOpen] = useState(false)
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

  useEffect(() => {
    setOwnBlurbLocal(null)
  }, [selectedIndex])

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
    if (selected?.is_placeholder) setPickerOpen(true)
  }

  // 3rd-party carousel: touch swipe
  const carouselRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

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

  function renderHeroSlot(item: RankItem | undefined, ghost: boolean) {
    if (!item || item.is_placeholder) return <div className="flex-1" aria-hidden />
    const opacity = ghost ? 'opacity-40 ' : 'opacity-100'
    const size = ghost ? 'min(50vw,160px)' : 'min(85vw,320px)'
    if (type === 'driver') {
      return (
        <div
          className={`flex items-end justify-center transition-all duration-300 ${opacity}`}
          style={{ minHeight: ghost ? 120 : 200 }}
        >
          <div
            className="flex-shrink-0"
            style={{
              width: ghost ? 'min(50vw,160px)' : size,
              height: ghost ? 'min(50vw,160px)' : size,
              minWidth: ghost ? 80 : 200,
              minHeight: ghost ? 80 : 200,
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
      {/* Top half: hero */}
      <div className="relative h-[60vh] flex flex-col overflow-hidden">
        {/* Background: driver/track use gradient + dimmed image; team uses plain image */}
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
        {/* Hero: view mode = 3-slot carousel with swipe; edit mode = single centered */}
        {mode === 'view' ? (
          <div
            ref={carouselRef}
            className="absolute inset-0 z-[1] flex items-end justify-center gap-2 touch-pan-y"
            style={{ touchAction: 'pan-y' }}
            role="region"
            aria-label="Grid ranking carousel - swipe left or right to change"
          >
            <div
              className="flex min-w-0 flex-1 items-end z-[-1]"
            >
              {renderHeroSlot(items[selectedIndex - 1], true)}
            </div>
            <div className="flex flex-shrink-0 items-end justify-center" aria-current="true">
              {renderHeroSlot(selectedItem ?? undefined, false)}
            </div>
            <div
              className="flex min-w-0 flex-1 items-end justify-end z-[-1]"
            >
              {renderHeroSlot(items[selectedIndex + 1], true)}
            </div>
          </div>
        ) : (
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
        )}

        {/* Section title SVG: left of screen, bottom of top section */}
        <div
          className="absolute left-0 bottom-4 z-20 flex items-end pl-2 w-12"
          aria-hidden
        >
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
          {/* Username's Grid; Edit button right (own profile view only) */}
          <div className="flex items-start justify-between gap-4 shrink-0 mb-4">
            <h1 className="text-3xl font-serif text-white font-normal font-display min-w-0 capitalize">
              {owner.username}&apos;s <br/> Grid
            </h1>
            {isOwnProfile && mode === 'view' && (
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

            {/* Position number on the right of center image (view mode only) */}
            {mode === 'view' && (
              <div className="flex shrink-0 items-end justify-end self-stretch">
                <span
                  className="font-bold text-white"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(3rem, 12vw, 6rem)', lineHeight: 1 }}
                  aria-label={`Rank ${selectedIndex + 1} on this grid`}
                >
                  {selectedIndex + 1}
                </span>
              </div>
            )}

            </div>
            </div>
            </div>

      {/* Bottom half: black bg, owner/own blurb, hr, pills, comments */}
      <div className="bg-black px-4 py-6">
        {/* Entity name row with prev/next arrows (accessibility) */}
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

        {/* 3rd-party: owner blurb for current slot at top of bottom half */}
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

        {/* Own profile view: blurb section with edit / input at top of bottom half (per slot) */}
        {isOwnProfile && mode === 'view' && (
          <OwnProfileBlurbBlock
            owner={owner}
            gridId={grid.id}
            rankIndex={rankIndex}
            initialBlurb={currentSlotBlurbFromData}
            ownBlurbDisplay={ownBlurbDisplay}
            setOwnBlurbLocal={setOwnBlurbLocal}
            onSlotBlurbSaved={(_, value) =>
              setSlotBlurbsLocal((prev) => ({ ...prev ?? {}, [rankIndex]: value }))
            }
            isEditingOwnBlurb={isEditingOwnBlurb}
            setIsEditingOwnBlurb={setIsEditingOwnBlurb}
            ownBlurbSaving={ownBlurbSaving}
            setOwnBlurbSaving={setOwnBlurbSaving}
          />
        )}

        {/* Edit mode: per-slot blurb for currently selected rank */}
        {mode === 'edit' && onSlotBlurbChange && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/90 mb-2">
              Blurb for rank {rankIndex} (optional, max 140)
            </label>
            <textarea
              value={(slotBlurbsFromProps ?? {})[rankIndex] ?? ''}
              onChange={(e) => onSlotBlurbChange(rankIndex, e.target.value.slice(0, 140))}
              placeholder="Add a blurb for this spot..."
              rows={3}
              className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/60">
              {((slotBlurbsFromProps ?? {})[rankIndex] ?? '').length}/140
            </p>
          </div>
        )}

        {/* Light hr between blurb section and pills/comments */}
        {shouldShowBlurbPanel && (
          <hr className="mb-6 border-white/20" />
        )}

        {mode === 'view' && (
          <GridSlotCommentSection
            gridId={grid.id}
            rankIndex={selectedIndex + 1}
          />
        )}
        {mode === 'edit' && onRankedListChange && (
          <>
            <GridRankPillsDnd
              rankedItems={items}
              type={type}
              selectedIndex={selectedIndex}
              onSelectIndex={handleSelectRankIndex}
              onRankedListChange={onRankedListChange}
              supabaseUrl={supabaseUrl}
            />
            <DragHint />
            {availableItems && availableItems.length > 0 && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="text-sm text-[#25B4B1] hover:text-[#3BEFEB] bg-white/30 rounded-full px-4 py-2"
                >
                  Change pick at rank {selectedIndex + 1}
                </button>
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
                  disabled={items.length === 0}
                  className="rounded-full bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  Save Ranking
                </button>
              </div>
            )}
            {availableItems && (
              <GridItemPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                type={type}
                items={availableItems}
                selectedRankIndex={selectedIndex}
                supabaseUrl={supabaseUrl}
                onSelect={(item) => {
                  if (!onRankedListChange) return
                  const fullItem = (availableItems.find((a) => a.id === item.id) ?? item) as RankItem
                  const next = Array.from({ length: 10 }, (_, i) => {
                    const current = (rankedList ?? [])[i]
                    return current ?? { id: `__placeholder__${i}`, name: '', is_placeholder: true }
                  })

                  for (let i = 0; i < next.length; i++) {
                    if (next[i]?.id === fullItem.id)
                      next[i] = { id: `__placeholder__${i}`, name: '', is_placeholder: true } as RankItem
                  }

                  next[selectedIndex] = fullItem
                  onRankedListChange(next.slice(0, 10))
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
