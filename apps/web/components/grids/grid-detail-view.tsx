'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getNationalityFlagPath } from '@/utils/flags'
import { getTeamBackgroundUrl } from '@/utils/storage-urls'
import { DriverHeroMedia } from './hero/driver-hero-media'
import { TrackHeroMedia } from './hero/track-hero-media'
import { TeamHeroMedia } from './hero/team-hero-media'
import { GridBlurbCard } from './grid-blurb-card'
import { GridRankPills } from './grid-rank-pills'
import { GridRankPillsDnd } from './grid-rank-pills-dnd'
import { GridItemPickerModal } from './grid-item-picker-modal'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  }
  owner: { id: string; username: string; profile_image_url: string | null }
  isOwnProfile: boolean
  supabaseUrl?: string
  mode: 'view' | 'edit'
  /** Edit mode: controlled ranked list and save handler; view mode ignores */
  rankedList?: RankItem[]
  onRankedListChange?: (items: RankItem[]) => void
  onSave?: () => void
  /** Edit mode: blurb and handlers for editing */
  blurb?: string
  onBlurbChange?: (value: string) => void
  /** Edit mode: full catalog for change-pick modal */
  availableItems?: RankItem[]
}

const VERTICAL_LABEL: Record<GridType, string> = {
  driver: 'DRIVERS',
  track: 'TRACKS',
  team: 'TEAMS',
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
  availableItems,
}: GridDetailViewProps) {
  const items = mode === 'edit' && rankedList ? rankedList : grid.ranked_items
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const selectedItem = items[selectedIndex]
  const type = grid.type
  const isPlaceholderSelected = Boolean(selectedItem && selectedItem.is_placeholder)
  const doesHaveBlurb = Boolean(grid.blurb && grid.blurb.trim().length > 0)
  const isBlurbEditable = mode === 'edit' && Boolean(onBlurbChange)
  const shouldShowBlurbPanel = isBlurbEditable || doesHaveBlurb
  const isBlurbCollapsible = mode === 'view' && doesHaveBlurb
  const [isBlurbOpen, setIsBlurbOpen] = useState(true)

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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top half: hero */}
      <div className="relative h-[55vh] flex flex-col">
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
        {/* Hero image: full-bleed layer, centered horizontally (x), aligned to bottom of section (y), responsive */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
          {selectedItem && !isPlaceholderSelected && type === 'driver' && (
            <div
              key={selectedIndex}
              className="transition-all duration-300 h-[min(85vw,320px)] w-[min(85vw,320px)] min-h-[200px] min-w-[200px] mb-2"
            >
              <DriverHeroMedia
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

        <div className="relative z-10 flex flex-1 flex-col min-h-0 px-4 pt-14 pb-0 overflow-x-hidden">
          {/* Name + flag above, top left */}
          {selectedItem && (
            <div className="flex flex-col items-start text-left shrink-0 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-4xl font-serif text-white font-normal font-display w-full">
                  {isPlaceholderSelected
                    ? `Select a ${type === 'driver' ? 'driver' : type === 'team' ? 'team' : 'track'}`
                    : selectedItem.name}
                </h1>
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
                    {(selectedItem as TrackRankItem).location && `${(selectedItem as TrackRankItem).location}, `}
                    {(selectedItem as TrackRankItem).country}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="relative flex w-full gap-4 items-end min-h-0 flex-1">
            {/* Left: vertical label */}
            <div className="flex min-h-0 w-[25px] shrink-0 items-end justify-center overflow-hidden self-stretch">
              <span
                className="block shrink-0 text-[30px] font-extrabold uppercase leading-none text-transparent"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  width: 0,
                  height: 30,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center center',
                  WebkitTextStroke: '1px #25B4B1',
                  color: 'rgba(255,255,255,0)',
                }}
              >
                {VERTICAL_LABEL[type]}
              </span>
            </div>

            {/* Spacer so blurb can sit on the right */}
            <div className="flex-1 min-w-0" />

            {/* Blurb on the right, bottom of top section */}
            {shouldShowBlurbPanel ? (
              <div
                className={`transition-transform duration-300 ease-out ${
                  isBlurbCollapsible
                    ? `absolute -right-4 bottom-2 ${isBlurbOpen ? 'translate-x-0' : 'translate-x-[calc(100%-44px)]'}`
                    : 'shrink-0 self-end mb-2 translate-x-0'
                }`}
              >
                <div
                  className={`relative bg-black/80 text-white overflow-hidden ${
                    isBlurbCollapsible
                      ? isBlurbOpen
                        ? 'w-[280px] rounded-lg p-2'
                        : 'w-[280px] h-20 rounded-l-xl rounded-r-none p-0'
                      : 'w-full max-w-[280px] rounded-lg p-2'
                  }`}
                >
                  {isBlurbCollapsible ? (
                    <button
                      type="button"
                      onClick={() => setIsBlurbOpen((prev) => !prev)}
                      className={`absolute left-0 top-0 flex h-full w-[44px] items-center justify-center rounded-l-xl ${
                        isBlurbOpen ? 'hover:bg-white/5' : 'hover:bg-black/70'
                      }`}
                      aria-label={isBlurbOpen ? 'Hide blurb panel' : 'Show blurb panel'}
                      aria-expanded={isBlurbOpen}
                    >
                      {isBlurbOpen ? (
                        <ChevronRight className="h-5 w-5 text-white/80" />
                      ) : (
                        <ChevronLeft className="h-5 w-5 text-white/80" />
                      )}
                    </button>
                  ) : null}

                  {mode === 'edit' && onBlurbChange ? (
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2">Blurb (optional, max 140)</label>
                    <textarea
                      value={blurbOverride ?? grid.blurb ?? ''}
                      onChange={(e) => {
                        if (e.target.value.length <= 140) onBlurbChange(e.target.value)
                      }}
                      rows={3}
                      placeholder="Add a blurb about your ranking..."
                      className="w-full rounded bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 border border-white/20 focus:border-[#25B4B1] focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-white/60">{(blurbOverride ?? grid.blurb ?? '').length}/140</p>
                  </div>
                ) : (
                    <>
                      {isBlurbCollapsible && !isBlurbOpen ? null : (
                        <div className={isBlurbCollapsible ? 'pl-[44px]' : ''}>
                          <GridBlurbCard
                            gridId={grid.id}
                            blurb={grid.blurb ?? null}
                            likeCount={grid.like_count ?? 0}
                            isLiked={grid.is_liked ?? false}
                            owner={owner}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                      )}
                    </>
                )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Bottom half: black bg, pills */}
      <div className="bg-black px-4 py-6">
        {mode === 'view' && (
          <GridRankPills
            rankedItems={grid.ranked_items}
            type={type}
            selectedIndex={selectedIndex}
            onSelectIndex={handleSelectRankIndex}
            supabaseUrl={supabaseUrl}
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
                  className="text-sm text-[#25B4B1] hover:text-[#3BEFEB]"
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
