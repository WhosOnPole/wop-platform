import { TrackHeroMedia } from '@/components/grids/hero/track-hero-media'

interface EntityHeroBackgroundProps {
  imageUrl: string | null | undefined
  alt: string
  entityType?: 'track' | 'team' | 'driver'
  entityId?: string
  trackSlug?: string
  trackName?: string
  supabaseUrl?: string
}

export function EntityHeroBackground({
  imageUrl,
  alt,
  entityType,
  entityId,
  trackSlug,
  trackName,
  supabaseUrl,
}: EntityHeroBackgroundProps) {
  const isTrack = entityType === 'track'
  const showTrackSvg = isTrack && trackSlug && supabaseUrl

  return (
    <div className="absolute inset-0 z-0">
      {/* Background: image for drivers/teams; entity_bg for tracks (then darkened) */}
      {imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${imageUrl})` }}
          aria-label={alt}
        />
      )}
      {/* Dark overlay: stronger for tracks so entity_bg is darkened */}
      {showTrackSvg ? (
        <div className="absolute inset-0 bg-black/50" aria-hidden />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60" />

      {/* Track SVG from storage (track pages) */}
      {showTrackSvg && (
        <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none">
          <TrackHeroMedia
            trackSlug={trackSlug}
            trackName={trackName ?? alt}
            supabaseUrl={supabaseUrl}
            className="h-[min(50vh,320px)] w-full max-w-[min(90vw,320px)] max-h-full"
          />
        </div>
      )}
    </div>
  )
}
