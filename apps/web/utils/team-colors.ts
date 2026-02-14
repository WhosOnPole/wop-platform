/**
 * Team primary/secondary colors and gradients for profile backgrounds and grid UI
 */

const DEFAULT_PRIMARY = '#25B4B1'
const DEFAULT_SECONDARY = '#764BA2'
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667EEA, #764BA2)'

/** Canonical team colors: primary | secondary (hex) */
export const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  ferrari: { primary: '#da291c', secondary: '#ffffff' },
  alpine: { primary: '#FF88BD', secondary: '#061a4d' },
  'aston martin': { primary: '#00665e', secondary: '#b9c600' },
  haas: { primary: '#e6002d', secondary: '#000000' },
  audi: { primary: '#ffffff', secondary: '#101319' },
  cadillac: { primary: '#ffffff', secondary: '#000000' },
  mclaren: { primary: '#ff8000', secondary: '#ffffff' },
  mercedes: { primary: '#00f5d0', secondary: '#00a39e' },
  'mercedes-amg petronas': { primary: '#00f5d0', secondary: '#00a39e' },
  'racing bulls': { primary: '#070b36', secondary: '#ffffff' },
  'red bull racing': { primary: '#db0a40', secondary: '#00162b' },
  'red bull': { primary: '#00162b', secondary: '#db0a40' },
  williams: { primary: '#2270ff', secondary: '#000a20' },
  'alpha tauri': { primary: '#070b36', secondary: '#ffffff' },
  sauber: { primary: '#101319', secondary: '#ffffff' },
  'alfa romeo': { primary: '#900000', secondary: '#6B0000' },
}

/** Normalize team name for lookup; aliases map to canonical keys in TEAM_COLORS */
function normalizeTeamKey(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * Returns primary and secondary colors for a team, or null if unknown.
 */
export function getTeamColors(teamName: string | null | undefined): { primary: string; secondary: string } | null {
  if (!teamName || typeof teamName !== 'string') return null
  const key = normalizeTeamKey(teamName)
  const colors = TEAM_COLORS[key]
  return colors ?? null
}

/**
 * Returns primary color for a team, or default hex for use in grid rank numbers etc.
 */
export function getTeamPrimaryColor(teamName: string | null | undefined): string {
  const colors = getTeamColors(teamName)
  return colors?.primary ?? DEFAULT_PRIMARY
}

/**
 * Returns secondary color for a team, or default hex for use in grid rank numbers etc.
 */
export function getTeamSecondaryColor(teamName: string | null | undefined): string {
  const colors = getTeamColors(teamName)
  return colors?.secondary ?? DEFAULT_SECONDARY
}

/**
 * Team color gradients for profile backgrounds (uses primary/secondary).
 */
export function getTeamBackgroundGradient(teamName: string): string {
  const colors = getTeamColors(teamName)
  if (colors) {
    return `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
  }
  return DEFAULT_GRADIENT
}
