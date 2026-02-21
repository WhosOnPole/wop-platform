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
        ? { value: (entity as DriverEntity).racing_number, suffix: 'Driver No.' }
        : null
  const overviewText = entity.overview_text ?? null
  const hasContent = leftContent != null || overviewText

  if (!hasContent) return null

  return (
    <div className="w-full overflow-hidden bg-black p-4">
      <div className="mx-auto flex max-w-6xl flex-row items-center gap-2 sm:gap-8">
        {leftContent != null && (
          <div className="flex w-1/3 flex-col overflow-hidden font-sageva text-sunset-gradient border-r border-white/10 pr-4 mr-4">
            <div className="flex flex-col items-center pt-1">
              <span
                className="min-w-0 overflow-hidden leading-none"
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
          </div>
        )} 
        {overviewText && (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-hidden">
            <p className="text-base text-white/90 leading-relaxed font-light">
              {overviewText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
