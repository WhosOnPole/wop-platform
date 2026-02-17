import { TrackHeroMedia } from '@/components/grids/hero/track-hero-media'

interface EntityHeroBackgroundProps {
  imageUrl: string | null | undefined
  alt: string
  entityType?: 'track' | 'team' | 'driver'
  entityId?: string
  trackSlug?: string
  trackName?: string
  supabaseUrl?: string
  teamName?: string
}

function getTeamShortCode(teamName: string): string {
  const letters = teamName.replace(/[^a-zA-Z]/g, '').slice(0, 3)
  return letters.toUpperCase() || teamName.slice(0, 3).toUpperCase()
}

export function EntityHeroBackground({
  imageUrl,
  alt,
  entityType,
  entityId,
  trackSlug,
  trackName,
  supabaseUrl,
  teamName,
}: EntityHeroBackgroundProps) {
  const isTrack = entityType === 'track'
  const isTeam = entityType === 'team'
  const showTrackSvg = isTrack && trackSlug && supabaseUrl
  const showTeamShortCode = isTeam && teamName

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
            className="h-[min(50vh,320px)] w-full max-h-full"
          />
        </div>
      )}

      {/* Team: short code (first 3 letters) full width, font-weight 900, opacity 30% */}
      {showTeamShortCode && (
        <div className="absolute inset-0 z-[1] flex items-center pointer-events-none overflow-visible">
          <span
            className="font-sans font-black text-white/30 select-none origin-left"
            style={{
              letterSpacing: '-0.05em',
              fontSize: 'clamp(15.5rem, 20vw, 18rem)',
              transform: 'translateX(-0.04em)',
            }}
          >
            {getTeamShortCode(teamName)}
          </span>
        </div>
      )}
    </div>
  )
}
