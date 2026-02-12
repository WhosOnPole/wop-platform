import Link from 'next/link'
import Image from 'next/image'

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
  nationality?: string | null
}

interface TeamDriversTabProps {
  drivers: Driver[]
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

export function TeamDriversTab({ drivers }: TeamDriversTabProps) {
  if (drivers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-white/5 p-8 text-center">
        <p className="text-white/60">No drivers assigned to this team.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {drivers.map((driver) => {
        const slug = slugify(driver.name)
        const imageSrc = driver.headshot_url || driver.image_url
        const flagPath = getNationalityFlagPath(driver.nationality)

        return (
          <Link
            key={driver.id}
            href={`/drivers/${slug}`}
            className="group flex flex-col"
          >
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border border-white/20 bg-white/10 transition-all group-hover:border-white/40">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={driver.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-white/60">
                  {driver.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-start gap-2">
              {flagPath && (
                <div className="relative h-5 w-5 flex-shrink-0 self-start">
                  <Image
                    src={flagPath}
                    alt={driver.nationality || 'Flag'}
                    fill
                    sizes="20px"
                    className="object-contain"
                  />
                </div>
              )}
              <p className="text-sm text-white/90 group-hover:text-white lowercase leading-tight">
                {driver.name}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
