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
  scrollProgress?: number
}

function getCountryFlagPath(country?: string | null): string | null {
  if (!country) return null
  const normalized = country.trim().toLowerCase()
  
  // Map country to flag file name
  const flagMap: Record<string, string> = {
    argentina: 'argentina',
    argentine: 'argentina',
    australia: 'australia',
    austria: 'austria',
    belgium: 'belgium',
    brazil: 'brazil',
    canada: 'canada',
    china: 'china',
    france: 'france',
    germany: 'germany',
    hungary: 'hungary',
    italy: 'italy',
    japan: 'japan',
    mexico: 'mexico',
    monaco: 'monaco',
    netherlands: 'netherlands',
    qatar: 'qatar',
    singapore: 'singapore',
    spain: 'spain',
    uk: 'uk',
    'united kingdom': 'uk',
    'united states': 'usa',
    usa: 'usa',
    abu_dhabi: 'uae',
    'abu dhabi': 'uae',
    uae: 'uae',
    united_arab_emirates: 'uae',
    'united arab emirates': 'uae',
    bahrain: 'bahrain',
    azerbaijan: 'azerbaijan',
    saudi: 'saudi_arabia',
    saudi_arabia: 'saudi_arabia',
    'saudi arabia': 'saudi_arabia',
  }
  
  const flagName = flagMap[normalized]
  if (!flagName) return null
  
  return `/images/flags/${flagName}_flag.svg`
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
    german: 'germany',
    germany: 'germany',
    french: 'france',
    france: 'france',
    italian: 'italy',
    american: 'usa',
    argentine: 'argentina',
    argentinian: 'argentina',
    argentina: 'argentina',
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

export function EntityHeader({ type, entity, drivers = [], supabaseUrl, scrollProgress = 0 }: EntityHeaderProps) {
  const maxScroll = 80
  const scrollOffset = Math.min(scrollProgress * maxScroll, maxScroll)

  if (type === 'track') {
    // Track title, flag, location are shown at top of page (over back button)
    return <div className="relative z-10 h-full" aria-hidden />
  }

  if (type === 'team') {
    const team = entity as TeamEntity

    return (
      <div className="relative z-10 px-4 pb-8 text-white flex flex-col justify-end h-full">
        <div
          style={{
            transform: `translateY(-${scrollOffset}px)`,
            transition: 'transform 0.3s ease',
          }}
        >
        <h1 className="mb-6 text-3xl font-display tracking-wider md:text-6xl">
          {team.name}
        </h1>
        {drivers.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {drivers.map((driver) => {
              const driverSlug = slugify(driver.name)
              return (
                <Link
                  key={driver.id}
                  href={`/drivers/${driverSlug}`}
                  className="text-lg text-white/90 hover:text-white transition-colors"
                >
                  {driver.name}
                </Link>
              )
            })}
          </div>
        )}
        </div>
      </div>
    )
  }

  // Driver: simple scrolling, no scroll-linked transform
  const driver = entity as DriverEntity
  const flagPath = getNationalityFlagPath(driver.nationality)
  const team = driver.teams

  return (
    <div className="relative z-10 px-4 pb-8 text-white flex flex-col justify-end h-full">
      <div>
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
    </div>
  )
}
