interface DriverStats {
  age?: number | null
  podiums_total?: number | null
  world_championships?: number | null
  current_standing?: number | null
  teams?: {
    name: string
  } | null
}

interface TeamStats {
  overview_text?: string | null
}

interface TrackStats {
  laps?: number | null
  turns?: number | null
  location?: string | null
  country?: string | null
  history_text?: string | null
}

type EntityType = 'driver' | 'team' | 'track'

interface StatsTabProps {
  type: EntityType
  stats: DriverStats | TeamStats | TrackStats
}

export function StatsTab({ type, stats }: StatsTabProps) {
  if (type === 'driver') {
    const driverStats = stats as DriverStats
    return (
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {driverStats.teams && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Team</p>
            <p className="mt-1 text-lg font-semibold text-white">{driverStats.teams.name}</p>
          </div>
        )}
        {driverStats.age && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Age</p>
            <p className="mt-1 text-lg font-semibold text-white">{driverStats.age}</p>
          </div>
        )}
        {driverStats.podiums_total !== null && driverStats.podiums_total !== undefined && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Podiums</p>
            <p className="mt-1 text-lg font-semibold text-white">{driverStats.podiums_total}</p>
          </div>
        )}
        {driverStats.world_championships !== null &&
          driverStats.world_championships !== undefined && (
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <p className="text-sm text-white/60">World Championships</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {driverStats.world_championships}
              </p>
            </div>
          )}
        {driverStats.current_standing && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Current Standing</p>
            <p className="mt-1 text-lg font-semibold text-white">
              #{driverStats.current_standing}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (type === 'team') {
    const teamStats = stats as TeamStats
    return (
      <div>
        {teamStats.overview_text && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-6">
            <p className="text-white/90 leading-relaxed">{teamStats.overview_text}</p>
          </div>
        )}
      </div>
    )
  }

  // Track
  const trackStats = stats as TrackStats
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {trackStats.laps != null && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Laps</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {trackStats.laps} laps
            </p>
          </div>
        )}
        {trackStats.turns && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Turns</p>
            <p className="mt-1 text-lg font-semibold text-white">{trackStats.turns}</p>
          </div>
        )}
        {trackStats.location && (
          <div className="rounded-lg border border-white/20 bg-white/5 p-4">
            <p className="text-sm text-white/60">Location</p>
            <p className="mt-1 text-lg font-semibold text-white">{trackStats.location}</p>
          </div>
        )}
      </div>
      {trackStats.history_text && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-6">
          <h3 className="mb-3 text-lg font-semibold text-white">History</h3>
          <p className="text-white/90 leading-relaxed">{trackStats.history_text}</p>
        </div>
      )}
    </div>
  )
}
