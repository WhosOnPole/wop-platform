'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { GridType } from './grid-rank-pills'
import { getTeamIconUrl, getTrackSlug, getTrackSvgUrl } from '@/utils/storage-urls'
import { DriverCardMedia } from '@/components/drivers/driver-card-media'

interface GridItemPickerModalProps {
  open: boolean
  onClose: () => void
  type: GridType
  items: Array<{
    id: string
    name: string
    nationality?: string | null
    headshot_url?: string | null
    image_url?: string | null
    team_name?: string | null
    location?: string | null
    country?: string | null
    track_slug?: string | null
  }>
  selectedRankIndex: number
  onSelect: (item: { id: string; name: string }) => void
  title?: string
  supabaseUrl?: string
}

export function GridItemPickerModal({
  open,
  onClose,
  type,
  items,
  selectedRankIndex,
  onSelect,
  title,
  supabaseUrl,
}: GridItemPickerModalProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, query])

  if (!open) return null

  function handleSelect(item: { id: string; name: string }) {
    onSelect(item)
    setQuery('')
    onClose()
  }

  const typeLabel = type === 'driver' ? 'Driver' : type === 'team' ? 'Team' : 'Track'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-x-0 bottom-0 animate-picker-sheet-in">
        <div className="mx-auto w-full max-w-2xl rounded-t-3xl border border-white/10 bg-[#1D1D1D] shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-white/10 flex items-center justify-between gap-3">
            <h2 id="picker-modal-title" className="text-base font-semibold text-white">
              {title ?? `Replace rank ${selectedRankIndex + 1} with a ${typeLabel}`}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="px-5 pt-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${typeLabel}s...`}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-white placeholder:text-white/50 focus:border-[#25B4B1] focus:outline-none"
              autoFocus
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-white/60 text-sm">No matches</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filtered.slice(0, 120).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="group flex flex-col text-left"
                  >
                    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-black/30 border border-white/10">
                      {type === 'driver' ? (
                        <DriverCardMedia
                          driverName={item.name}
                          supabaseUrl={supabaseUrl}
                          fallbackSrc={item.headshot_url || item.image_url}
                          sizes="240px"
                          darkenBackgroundOnly
                        />
                      ) : type === 'team' ? (
                        <PickerAvatar
                          src={supabaseUrl ? getTeamIconUrl(item.name, supabaseUrl) : null}
                          alt={item.name}
                          fallback={item.name.charAt(0).toUpperCase()}
                          variant="team"
                        />
                      ) : (
                        <TrackCardMedia
                          trackName={item.name}
                          trackSlug={item.track_slug ?? null}
                          supabaseUrl={supabaseUrl}
                        />
                      )}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm text-white group-hover:text-gray-300 lowercase leading-tight">
                        {item.name}
                      </p>
                      {type === 'driver' && item.team_name ? (
                        <p className="text-xs text-white/60 truncate">{item.team_name}</p>
                      ) : null}
                      {type === 'track' && (item.location || item.country) ? (
                        <p className="text-xs text-white/60 truncate">
                          {item.location ? `${item.location}${item.country ? ', ' : ''}` : ''}
                          {item.country ?? ''}
                        </p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes picker-sheet-in {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-picker-sheet-in {
          animation: picker-sheet-in 240ms ease-out;
        }
      `}</style>
    </div>
  )
}

interface PickerAvatarProps {
  src?: string | null
  alt: string
  fallback: string
  variant?: 'default' | 'team'
}

function PickerAvatar({ src, alt, fallback, variant = 'default' }: PickerAvatarProps) {
  const isTeam = variant === 'team'

  return (
    <div className={`relative h-full w-full overflow-hidden ${isTeam ? 'bg-transparent p-4' : 'bg-gray-100'}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="240px"
          className={isTeam ? 'object-contain brightness-0 invert' : 'object-cover'}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-gray-500">
          {fallback}
        </div>
      )}
    </div>
  )
}

interface TrackCardMediaProps {
  trackName: string
  trackSlug: string | null
  supabaseUrl?: string
}

function TrackCardMedia({ trackName, trackSlug, supabaseUrl }: TrackCardMediaProps) {
  if (!supabaseUrl) {
    return (
      <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/images/race_banner.png)' }} />
    )
  }

  const slug = trackSlug ?? getTrackSlug(trackName)
  const svgUrl = getTrackSvgUrl(slug, supabaseUrl)

  return (
    <>
      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(/images/race_banner.png)' }} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Image src={svgUrl} alt="" width={220} height={220} className="object-contain opacity-90" />
      </div>
    </>
  )
}
