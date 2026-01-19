import Image from 'next/image'
import Link from 'next/link'

interface TrackEntity {
  name: string
  location?: string | null
  country?: string | null
  track_length?: number | null
  turns?: number | null
  built_date?: string | null
}

interface TeamEntity {
  name: string
}

interface DriverEntity {
  name: string
  nationality?: string | null
  teams?: {
    id: string
    name: string
    image_url?: string | null
  } | null
}

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
}

type EntityType = 'track' | 'team' | 'driver'

interface EntityHeaderProps {
  type: EntityType
  entity: TrackEntity | TeamEntity | DriverEntity
  drivers?: Driver[]
}

function getCountryFlag(country?: string | null) {
  if (!country) return ''
  const normalized = country.trim().toLowerCase()
  const flags: Record<string, string> = {
    australia: '🇦🇺',
    austria: '🇦🇹',
    belgium: '🇧🇪',
    brazil: '🇧🇷',
    canada: '🇨🇦',
    china: '🇨🇳',
    france: '🇫🇷',
    germany: '🇩🇪',
    hungary: '🇭🇺',
    italy: '🇮🇹',
    japan: '🇯🇵',
    mexico: '🇲🇽',
    monaco: '🇲🇨',
    netherlands: '🇳🇱',
    qatar: '🇶🇦',
    saudi: '🇸🇦',
    'saudi arabia': '🇸🇦',
    singapore: '🇸🇬',
    spain: '🇪🇸',
    uk: '🇬🇧',
    'united kingdom': '🇬🇧',
    'united states': '🇺🇸',
    usa: '🇺🇸',
    abu_dhabi: '🇦🇪',
    'abu dhabi': '🇦🇪',
    uae: '🇦🇪',
    'united arab emirates': '🇦🇪',
    azerbaijan: '🇦🇿',
    bahrain: '🇧🇭',
  }
  return flags[normalized] || ''
}

function getNationalityFlag(nationality?: string | null) {
  if (!nationality) return ''
  const normalized = nationality.trim().toLowerCase()
  const flags: Record<string, string> = {
    british: '🇬🇧',
    english: '🇬🇧',
    scottish: '🏴',
    welsh: '🏴',
    dutch: '🇳🇱',
    spanish: '🇪🇸',
    mexican: '🇲🇽',
    monégasque: '🇲🇨',
    monegasque: '🇲🇨',
    finnish: '🇫🇮',
    australian: '🇦🇺',
    canadian: '🇨🇦',
    japanese: '🇯🇵',
    chinese: '🇨🇳',
    german: '🇩🇪',
    french: '🇫🇷',
    italian: '🇮🇹',
    american: '🇺🇸',
    argentine: '🇦🇷',
    brazilian: '🇧🇷',
    thai: '🇹🇭',
    danish: '🇩🇰',
    belgian: '🇧🇪',
    swiss: '🇨🇭',
    new_zealander: '🇳🇿',
    'new zealander': '🇳🇿',
    'south african': '🇿🇦',
    swedish: '🇸🇪',
  }
  return flags[normalized] || ''
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

export function EntityHeader({ type, entity, drivers = [] }: EntityHeaderProps) {
  if (type === 'track') {
    const track = entity as TrackEntity
    const flag = getCountryFlag(track.country)
    const yearEstablished = track.built_date
      ? new Date(track.built_date).getFullYear()
      : null

    return (
      <div className="relative z-10 px-4 pt-32 pb-8 text-white">
        <h1 className="mb-4 text-5xl font-display tracking-wider md:text-6xl lg:text-7xl">
          {track.name}
        </h1>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg">
            {flag && <span className="text-2xl">{flag}</span>}
            <span>
              {track.location || ''}
              {track.location && track.country ? ', ' : ''}
              {track.country || ''}
            </span>
          </div>
          {(track.track_length || track.turns || yearEstablished) && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              {track.track_length && track.turns && (
                <span>
                  {track.track_length} km / {track.turns} turns
                </span>
              )}
              {yearEstablished && <span>Est. {yearEstablished}</span>}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (type === 'team') {
    const team = entity as TeamEntity

    return (
      <div className="relative z-10 px-4 pt-32 pb-8 text-white">
        <h1 className="mb-6 text-5xl font-display tracking-wider md:text-6xl lg:text-7xl">
          {team.name}
        </h1>
        {drivers.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {drivers.map((driver) => {
              const driverSlug = slugify(driver.name)
              const imageSrc = driver.headshot_url || driver.image_url
              return (
                <Link
                  key={driver.id}
                  href={`/drivers/${driverSlug}`}
                  className="group flex flex-col items-center"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white/30 bg-white/10 transition-all group-hover:border-white/60">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={driver.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                        {driver.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="mt-2 text-sm text-white/90 group-hover:text-white">
                    {driver.name}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Driver
  const driver = entity as DriverEntity
  const flag = getNationalityFlag(driver.nationality)
  const team = driver.teams

  return (
    <div className="relative z-10 px-4 pt-32 pb-8 text-white">
      <h1 className="mb-4 text-5xl font-display tracking-wider md:text-6xl lg:text-7xl">
        {driver.name}
      </h1>
      <div className="space-y-3">
        {flag && driver.nationality && (
          <div className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{flag}</span>
            <span>{driver.nationality}</span>
          </div>
        )}
        {team && (
          <Link
            href={`/teams/${slugify(team.name)}`}
            className="group flex items-center gap-3"
          >
            {team.image_url ? (
              <div className="relative h-12 w-12 overflow-hidden rounded border border-white/30 bg-white/10 transition-all group-hover:border-white/60">
                <Image
                  src={team.image_url}
                  alt={team.name}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded border border-white/30 bg-white/10 text-lg font-semibold text-white">
                {team.name.charAt(0)}
              </div>
            )}
            <span className="text-lg text-white/90 group-hover:text-white">
              {team.name}
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
