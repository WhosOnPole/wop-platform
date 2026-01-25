import Image from 'next/image'
import Link from 'next/link'
import { getTeamIconUrl } from '@/utils/storage-urls'

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
  age?: number | null
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
  supabaseUrl?: string
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

function getNationalityFlagPath(nationality?: string | null): string | null {
  if (!nationality) return null
  const normalized = nationality.trim().toLowerCase()
  
  // Map nationality to flag file name
  const flagMap: Record<string, string> = {
    british: 'uk',
    english: 'uk',
    scottish: 'uk',
    welsh: 'uk',
    dutch: 'netherlands',
    spanish: 'spain',
    mexican: 'mexico',
    monégasque: 'monaco',
    monegasque: 'monaco',
    finnish: 'uk', // No Finnish flag, fallback to UK
    australian: 'australia',
    canadian: 'canada',
    japanese: 'japan',
    chinese: 'china',
    german: 'uk', // No German flag, fallback to UK
    french: 'uk', // No French flag, fallback to UK
    italian: 'italy',
    american: 'usa',
    argentine: 'uk', // No Argentine flag, fallback to UK
    brazilian: 'brazil',
    thai: 'uk', // No Thai flag, fallback to UK
    danish: 'uk', // No Danish flag, fallback to UK
    belgian: 'belgium',
    swiss: 'uk', // No Swiss flag, fallback to UK
    new_zealander: 'uk', // No NZ flag, fallback to UK
    'new zealander': 'uk',
    'south african': 'uk', // No SA flag, fallback to UK
    swedish: 'uk', // No Swedish flag, fallback to UK
    austrian: 'austria',
    hungarian: 'hungary',
    qatari: 'qatar',
    emirati: 'uae',
    'united arab emirates': 'uae',
    azerbaijani: 'azerbaijan',
    bahraini: 'bahrain',
    singaporean: 'singapore',
    saudi: 'saudi_arabia',
    'saudi arabian': 'saudi_arabia',
  }
  
  const flagName = flagMap[normalized]
  if (!flagName) return null
  
  return `/images/flags/${flagName}_flag.svg`
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

export function EntityHeader({ type, entity, drivers = [], supabaseUrl }: EntityHeaderProps) {
  if (type === 'track') {
    const track = entity as TrackEntity
    const flag = getCountryFlag(track.country)
    const yearEstablished = track.built_date
      ? new Date(track.built_date).getFullYear()
      : null

    return (
      <div className="relative z-10 px-4 pb-8 text-white flex flex-col justify-end h-full">
        <h1 className="mb-4 text-3xl font-display tracking-wider md:text-6xl">
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
      <div className="relative z-10 px-4 pb-8 text-white flex flex-col justify-end h-full">
        <h1 className="mb-6 text-3xl font-display tracking-wider md:text-6xl">
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
  const flagPath = getNationalityFlagPath(driver.nationality)
  const team = driver.teams

  return (
    <div className="relative z-10 px-4 pb-8 text-white flex flex-col justify-end h-full">
      <h1 className="mb-4 text-3xl font-display tracking-wider md:text-6xl">
        {driver.name}
      </h1>
      <div className="space-y-2 pb-4">
        {/* First line: Flag | Nationality, Age */}
        {(flagPath || driver.nationality || driver.age) && (
          <div className="flex items-center gap-2 text-lg">
            {flagPath && (
              <Image
                src={flagPath}
                alt={driver.nationality || 'Flag'}
                width={24}
                height={24}
                className="object-contain"
              />
            )}
            {driver.nationality && (
              <>
                <span className="text-lg">{driver.nationality}</span>
                {driver.age && <span className="text-lg">• {driver.age}</span>}
              </>
            )}
            {!driver.nationality && driver.age && (
              <span className="text-lg">{driver.age}</span>
            )}
          </div>
        )}
        {/* Second line: Team icon */}
        {/* {team && (
          <div className="flex items-center">
            <Link
              href={`/teams/${slugify(team.name)}`}
              className="group"
            >
              {(() => {
                const teamIconUrl = supabaseUrl ? getTeamIconUrl(team.name, supabaseUrl) : team.image_url
                return teamIconUrl ? (
                  <div className="relative h-6 w-6 overflow-hidden rounded-full border border-white/30 bg-white/10 transition-all group-hover:border-white/60">
                    <Image
                      src={teamIconUrl}
                      alt={team.name}
                      fill
                      sizes="24px"
                      className="object-contain p-0.5 brightness-0 invert"
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xs font-semibold text-white">
                    {team.name.charAt(0)}
                  </div>
                )
              })()}
            </Link>
          </div>
        )} */}
      </div>
    </div>
  )
}
