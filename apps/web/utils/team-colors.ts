/**
 * Team color gradients for profile backgrounds
 * Placeholder gradients until designer files arrive
 */

export function getTeamBackgroundGradient(teamName: string): string {
  const normalized = teamName.toLowerCase().trim()
  
  // Map team names to gradient color pairs (from, to)
  const teamGradients: Record<string, { from: string; to: string }> = {
    'red bull racing': { from: '#1E41FF', to: '#0600EF' }, // Blue gradient
    'red bull': { from: '#1E41FF', to: '#0600EF' },
    'mercedes': { from: '#00D2BE', to: '#00A08B' }, // Teal gradient
    'mercedes-amg petronas': { from: '#00D2BE', to: '#00A08B' },
    'ferrari': { from: '#DC143C', to: '#8B0000' }, // Red gradient
    'mclaren': { from: '#FF8700', to: '#FF5800' }, // Orange gradient
    'alpine': { from: '#0090FF', to: '#0066CC' }, // Blue gradient
    'aston martin': { from: '#00665E', to: '#003D38' }, // Green gradient
    'alpha tauri': { from: '#2B4562', to: '#1A2F47' }, // Blue-gray gradient
    'haas': { from: '#FFFFFF', to: '#B6BABD' }, // White to gray gradient
    'alfa romeo': { from: '#900000', to: '#6B0000' }, // Dark red gradient
    'williams': { from: '#005AFF', to: '#0033CC' }, // Blue gradient
    'sauber': { from: '#52C41A', to: '#389E0D' }, // Green gradient
    'racing bulls': { from: '#1E41FF', to: '#0600EF' }, // Blue gradient (Red Bull sister team)
  }
  
  const gradient = teamGradients[normalized]
  
  if (gradient) {
    return `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
  }
  
  // Default gradient for unknown teams
  return 'linear-gradient(135deg, #667EEA, #764BA2)'
}
