import { TrackHeroMedia } from '@/components/grids/hero/track-hero-media'
import { getTeamShortCode } from '@/utils/team-colors'

interface EntityHeroBackgroundProps {
  imageUrl: string | null | undefined
  alt: string
  entityType?: 'track' | 'team' | 'driver'
  entityId?: string
  trackSlug?: string
  trackName?: string
  supabaseUrl?: string
  teamName?: string
  teamOverviewText?: string | null
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
  teamOverviewText,
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
        <div className="absolute inset-0 flex items-center justify-center z-[1] pointer-events-none w-full h-full mt-20 p-10">
          <TrackHeroMedia
            trackSlug={trackSlug}
            trackName={trackName ?? alt}
            supabaseUrl={supabaseUrl}
            className=""
          />
        </div>
      )}

      {/* Team: short code (first 3 letters) and overview text centered below */}
      {showTeamShortCode && (
        <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center pointer-events-none overflow-hidden">
          <span
            className="font-sans font-black text-white/30 select-none text-center"
            style={{
              letterSpacing: '-.04em',
              fontSize: 'clamp(4rem, 55vw, 14rem)',
              lineHeight: 1,
            }}
          >
            {getTeamShortCode(teamName)}
          </span>
          {teamOverviewText && (
            <p className="font-sans text-center text-white/90 text-base leading-relaxed mt-4 max-w-2xl">
              {teamOverviewText}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
