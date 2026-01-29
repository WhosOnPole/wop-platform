/**
 * Shared flag path helpers for country (tracks) and nationality (drivers).
 * Used by grid detail, entity headers, and pitlane.
 */

export function getCountryFlagPath(country?: string | null): string | null {
  if (!country) return null
  const normalized = country.trim().toLowerCase()

  const flagMap: Record<string, string> = {
    australia: 'australia',
    austria: 'austria',
    belgium: 'belgium',
    brazil: 'brazil',
    canada: 'canada',
    china: 'china',
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

export function getNationalityFlagPath(nationality?: string | null): string | null {
  if (!nationality) return null
  const normalized = nationality.trim().toLowerCase()

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
    finnish: 'uk',
    australian: 'australia',
    canadian: 'canada',
    japanese: 'japan',
    chinese: 'china',
    german: 'uk',
    french: 'uk',
    italian: 'italy',
    american: 'usa',
    argentine: 'uk',
    brazilian: 'brazil',
    thai: 'uk',
    danish: 'uk',
    belgian: 'belgium',
    swiss: 'uk',
    new_zealander: 'uk',
    'new zealander': 'uk',
    'south african': 'uk',
    swedish: 'uk',
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
