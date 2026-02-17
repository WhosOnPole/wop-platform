import Image from 'next/image'
import { TrackHeroMedia } from '@/components/grids/hero/track-hero-media'
import { getDriverBodyImageUrl } from '@/utils/storage-urls'

interface EntityHeroBackgroundProps {
  imageUrl: string | null | undefined
  alt: string
  entityType?: 'track' | 'team' | 'driver'
  entityId?: string
  trackSlug?: string
  trackName?: string
  supabaseUrl?: string
  teamDrivers?: Array<{ id: string; name: string }>
}

export function EntityHeroBackground({
  imageUrl,
  alt,
  entityType,
  entityId,
  trackSlug,
  trackName,
  supabaseUrl,
  teamDrivers,
}: EntityHeroBackgroundProps) {
  const isTrack = entityType === 'track'
  const isTeam = entityType === 'team'
  const showTrackSvg = isTrack && trackSlug && supabaseUrl
  const showTeamDriverBodies = isTeam && supabaseUrl && teamDrivers && teamDrivers.length > 0
  const driversToShow = showTeamDriverBodies ? teamDrivers.slice(0, 2) : []

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

      {/* Team: two driver body.png overlay, split left/right, bottom strip */}
      {showTeamDriverBodies && (
        <div className="absolute inset-x-0 bottom-0 z-[1] flex items-end justify-center pointer-events-none h-[min(68vh,480px)] min-h-[220px] translate-y-4">
          <div
            className="grid w-full h-full max-w-5xl mx-auto"
            style={{
              gridTemplateColumns: driversToShow.length === 1 ? '1fr' : '1fr 1fr',
            }}
          >
            {driversToShow.map((driver) => (
              <div
                key={driver.id}
                className="relative flex items-start justify-center min-h-0 w-full"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={getDriverBodyImageUrl(driver.name, supabaseUrl!)}
                    alt=""
                    fill
                    sizes="(max-width: 668px) 60vw, 400px"
                    className="object-cover object-top pt-32"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
