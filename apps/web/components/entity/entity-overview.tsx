interface TrackEntity {
  laps?: number | null
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

  const entity = props.entity
  const isTrack = props.type === 'track'
  const leftContent =
    isTrack && (entity as TrackEntity).laps != null
      ? { value: (entity as TrackEntity).laps, suffix: 'laps' }
      : !isTrack && (entity as DriverEntity).racing_number != null
        ? { value: (entity as DriverEntity).racing_number, suffix: null }
        : null
  const overviewText = entity.overview_text ?? null
  const hasContent = leftContent != null || overviewText

  if (!hasContent) return null

  return (
    <div className="w-full overflow-hidden bg-black px-4 pt-8 pt-6">
      <div className="mx-auto flex max-w-6xl flex-row gap-2 sm:gap-8">
        {leftContent != null && (
          <div
            className="flex min-w-0 flex-1 flex-col items-end justify-end gap-0 overflow-hidden font-sageva text-sunset-gradient"
          >
            <span
              className="min-w-0 overflow-hidden p-2 pb-0 text-end leading-none"
              style={{ fontSize: 'clamp(19vw, 14vw, 10rem)' }}
            >
              {leftContent.value}
            </span>
            {leftContent.suffix && (
              <span
                className="-mt-6 shrink-0 text-end leading-none sm:-mt-8"
                style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}
              >
                {leftContent.suffix}
              </span>
            )}
          </div>
        )}
        {overviewText && (
          <div className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden pb-7">
            <p className="text-base text-white/90 leading-relaxed font-light">
              {overviewText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
