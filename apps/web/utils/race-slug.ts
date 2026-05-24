import { toEntitySlug } from './url-slug'

export function getRaceSlug(track: { name: string }): string {
  return toEntitySlug(track.name)
}

/** Compare slugs ignoring hyphen/underscore separators and accents. */
export function slugCompare(a: string, b: string): boolean {
  const strip = (value: string) => toEntitySlug(value).replace(/-/g, '')
  return strip(a) === strip(b)
}

export interface RaceTrackSummary {
  id: string
  name: string
  location: string | null
  country: string | null
  start_date: string | null
  end_date: string | null
}

type TrackRow = RaceTrackSummary & { circuit_ref?: string | null }

function scoreTrackMatch(track: TrackRow, segments: string[]): number {
  const haystack = `${track.name} ${track.circuit_ref ?? ''}`.toLowerCase()
  return segments.filter((segment) => haystack.includes(segment.toLowerCase())).length
}

function isExactRaceSlugMatch(track: TrackRow, slug: string): boolean {
  return (
    slugCompare(track.name, slug) ||
    (track.circuit_ref != null && slugCompare(track.circuit_ref, slug)) ||
    toEntitySlug(track.name) === slug ||
    (track.circuit_ref != null && toEntitySlug(track.circuit_ref) === slug)
  )
}

/** Resolve a /race/[slug] track using the same rules as entity track pages. */
export async function resolveTrackFromRaceSlug(
  supabase: { from: (table: string) => any },
  slug: string
): Promise<RaceTrackSummary | null> {
  const decodedSlug = decodeURIComponent(slug).trim()
  const segments = decodedSlug.split(/[-_]+/).filter((segment) => segment.length >= 2)

  const orFilters = segments
    .flatMap((segment) => [`name.ilike.%${segment}%`, `circuit_ref.ilike.%${segment}%`])
    .join(',')

  const { data: tracks, error } = orFilters
    ? await supabase
        .from('tracks')
        .select('id, name, location, country, start_date, end_date, circuit_ref')
        .or(orFilters)
    : await supabase
        .from('tracks')
        .select('id, name, location, country, start_date, end_date, circuit_ref')
        .ilike('name', `%${decodedSlug.replace(/-/g, '%')}%`)

  if (error) {
    console.error('Error resolving track from race slug:', error)
    return null
  }

  const rows = (tracks || []) as TrackRow[]
  if (rows.length === 0) return null

  const exact = rows.find((track) => isExactRaceSlugMatch(track, decodedSlug))
  if (exact) return exact

  if (segments.length > 0) {
    const best = rows.reduce<TrackRow | null>((currentBest, track) => {
      if (!currentBest) return track
      return scoreTrackMatch(track, segments) > scoreTrackMatch(currentBest, segments)
        ? track
        : currentBest
    }, null)
    if (best) return best
  }

  return rows[0]
}
