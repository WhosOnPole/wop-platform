/**
 * Builds a URL slug from a name (hyphen-separated, accent-normalized).
 * Matches entity page routing for drivers and teams.
 */
export function toEntitySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}
