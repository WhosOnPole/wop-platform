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

  const entity = props.entity
  const isTrack = props.type === 'track'
  const leftContent =
    isTrack && (entity as TrackEntity).track_length != null
      ? { value: (entity as TrackEntity).track_length, suffix: 'km' }
      : !isTrack && (entity as DriverEntity).racing_number != null
        ? { value: (entity as DriverEntity).racing_number, suffix: null }
        : null
  const overviewText = entity.overview_text ?? null
  const hasContent = leftContent != null || overviewText

  if (!hasContent) return null

  return (
    <div className="w-full overflow-visible bg-black px-4 pt-8 pt-6">
      <div className="mx-auto flex max-w-6xl flex-row gap-2 sm:gap-8">
        {leftContent != null && (
          <div
            className="flex w-1/2 shrink-0 flex-col items-end justify-end gap-0 font-sageva text-sunset-gradient"
            style={{ minWidth: 0 }    }
          >
            <span className="whitespace-nowrap text-8xl leading-none sm:text-8xl md:text-9xl p-2 pb-0">
              {leftContent.value}
            </span>
            {leftContent.suffix && (
              <span className="-mt-8 text-6xl leading-none">{leftContent.suffix}</span>
            )}
          </div>
        )}
        {overviewText && (
          <div
            className="flex w-1/2 shrink-0 flex-col justify-end pb-7"
            style={{ minWidth: 0 }}
          >
            <p className="text-base text-white/90 leading-relaxed font-light">
              {overviewText}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
