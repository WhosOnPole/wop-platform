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
        const flag = getNationalityFlag(driver.nationality)

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
              {flag && (
                <span className="text-base leading-none bg-white/20 rounded-full p-1 self-start">
                  {flag}
                </span>
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
