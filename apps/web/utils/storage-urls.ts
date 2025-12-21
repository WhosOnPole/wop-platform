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
 * Gets the public URL for a driver's profile.jpg from S3 storage
 * @param driverName - The driver name
 * @param supabaseUrl - The Supabase project URL
 * @returns The public URL for the profile.jpg file
 */
export function getDriverProfileImageUrl(
  driverName: string,
  supabaseUrl: string
): string {
  const slug = getDriverSlug(driverName)
  const path = `${slug}/profile.jpg`
  return `${supabaseUrl}/storage/v1/object/public/drivers/${path}`
}

