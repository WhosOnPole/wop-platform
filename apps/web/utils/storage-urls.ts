/**
 * Utility functions for generating Supabase storage URLs
 * and converting names to slug formats for S3 folder paths
 */

/**
 * Converts a team name to S3 folder format (lowercase with underscores)
 * Example: "Red Bull Racing" -> "red_bull_racing"
 */
export function getTeamSlug(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Converts a driver name to S3 folder format (lowercase with underscores)
 * Example: "Lewis Hamilton" -> "lewis_hamilton"
 */
export function getDriverSlug(driverName: string): string {
  return driverName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Gets the public URL for a team's icon.svg from S3 storage
 * @param teamName - The team name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the icon.svg file
 */
export function getTeamIconUrl(teamName: string, supabaseUrl: string): string {
  const slug = getTeamSlug(teamName)
  const path = `${slug}/icon.svg`
  // Supabase storage public URL format: {supabaseUrl}/storage/v1/object/public/{bucket}/{path}
  return `${supabaseUrl}/storage/v1/object/public/teams/${path}`
}

/**
 * Gets the public URL for a team's logo.svg from S3 storage
 * @param teamName - The team name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the logo.svg file
 */
export function getTeamLogoUrl(teamName: string, supabaseUrl: string): string {
  const slug = getTeamSlug(teamName)
  const path = `${slug}/logo.svg`
  return `${supabaseUrl}/storage/v1/object/public/teams/${path}`
}

/**
 * Gets the public URL for a team's background.jpg from storage
 * @param teamName - The team name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the background.jpg file
 */
export function getTeamBackgroundUrl(teamName: string, supabaseUrl: string): string {
  const slug = getTeamSlug(teamName)
  const path = `${slug}/background.jpg`
  return `${supabaseUrl}/storage/v1/object/public/teams/${path}`
}

/** Slug overrides for driver profile.jpg when storage folder name differs (e.g. typos) */
const DRIVER_PROFILE_SLUG_OVERRIDES: Record<string, string> = {
  valtteri_bottas: 'valterri_bottas',
}

/**
 * Gets the public URL for a driver's profile.jpg from S3 storage
 * @param driverName - The driver name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the profile.jpg file
 */
export function getDriverProfileImageUrl(
  driverName: string,
  supabaseUrl: string
): string {
  const rawSlug = getDriverSlug(driverName)
  const slug = DRIVER_PROFILE_SLUG_OVERRIDES[rawSlug] ?? rawSlug
  const path = `${slug}/profile.jpg`
  return `${supabaseUrl}/storage/v1/object/public/drivers/${path}`
}

const DRIVER_BODY_SLUG_OVERRIDES: Record<string, string> = {
  // Storage folder is misspelled in bucket
  valtteri_bottas: 'valterri_bottas',
}

/**
 * Gets the public URL for a driver's body.png from storage
 * @param driverName - The driver name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the body.png file
 */
export function getDriverBodyImageUrl(driverName: string, supabaseUrl: string): string {
  const rawSlug = getDriverSlug(driverName)
  const slug = DRIVER_BODY_SLUG_OVERRIDES[rawSlug] ?? rawSlug
  const path = `${slug}/body.png`
  return `${supabaseUrl}/storage/v1/object/public/drivers/${path}`
}

/**
 * Normalizes accented characters to ASCII (é→e, ó→o, etc.)
 */
function normalizeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Converts a track name to storage folder format (lowercase with underscores)
 * Example: "Autódromo Hermanos Rodríguez" -> "autodromo_hermanos_rodriguez"
 * Handles accented characters by normalizing to ASCII equivalents.
 */
export function getTrackSlug(trackName: string): string {
  return normalizeAccents(trackName)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

/**
 * Overrides when storage folder name differs from getTrackSlug (e.g. legacy typo in bucket)
 */
const TRACK_SLUG_OVERRIDES: Record<string, string> = {
  // Storage folders created before accent normalization fix (ó stripped → autdromo)
  autodromo_hermanos_rodriguez: 'autdromo_hermanos_rodriguez',
  autodromo_jose_carlos_pace: 'autdromo_jose_carlos_pace',
}

/**
 * Gets the public URL for a track's circuit SVG from Storage (tracks bucket)
 * Path: tracks/<track_slug>/track.svg
 */
export function getTrackSvgUrl(trackSlug: string, supabaseUrl: string): string {
  const path = `${TRACK_SLUG_OVERRIDES[trackSlug] ?? trackSlug}/track.svg`
  return `${supabaseUrl}/storage/v1/object/public/tracks/${path}`
}

