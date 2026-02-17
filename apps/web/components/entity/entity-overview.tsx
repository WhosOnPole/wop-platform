interface TrackEntity {
  track_length?: number | null
  overview_text?: string | null
}

interface DriverEntity {
  name: string
  racing_number?: number | null
  overview_text?: string | null
}

type EntityOverviewProps =
  | { type: 'track'; entity: TrackEntity }
  | { type: 'driver'; entity: DriverEntity }
  | { type: 'team' }

export function EntityOverview(props: EntityOverviewProps) {
  if (props.type === 'team') return null

  if (props.type === 'track') {
    const track = props.entity
    const hasContent = track.track_length != null || track.overview_text

    if (!hasContent) return null

    return (
      <div className="w-full overflow-visible bg-black px-4 py-8 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-row gap-2 sm:gap-8">
          {track.track_length != null && (
            <div className="flex w-1/2 shrink-0 flex-col items-end justify-end gap-0 font-sageva text-sunset-gradient" style={{ minWidth: 0 }}>
              <span className="whitespace-nowrap text-8xl leading-none sm:text-8xl md:text-9xl p-2">
                {track.track_length}
              </span>
              <span className="-mt-8 text-6xl leading-none">km</span>
            </div>
          )}
          {track.overview_text && (
            <div
              className="flex w-1/2 shrink-0 flex-col justify-end pb-4"
              style={{ minWidth: 0 }}
            >
              <p className="text-base text-white/90 leading-relaxed font-light">
                {track.overview_text}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Driver
  const driver = props.entity
  const hasContent = driver.racing_number != null || driver.overview_text

  if (!hasContent) return null

  return (
    <div className="w-full overflow-visible bg-black px-4 py-8 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-row gap-2 sm:gap-8">
        {driver.racing_number != null && (
          <div className="flex w-1/2 shrink-0 flex-col justify-end" style={{ minWidth: 0 }}>
            <span className="font-sageva text-7xl leading-none text-sunset-gradient sm:text-8xl md:text-9xl">
              {driver.racing_number}
            </span>
          </div>
        )}
        {driver.overview_text && (
          <div
            className="flex w-1/2 shrink-0 flex-col justify-end pb-4"
            style={{ minWidth: 0 }}
          >
            <p className="text-base text-white/90 leading-relaxed font-light">
              {driver.overview_text}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
