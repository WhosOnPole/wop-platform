/** Strips " / sprint" suffix from names for display on grid cards */
export function stripSprintSuffix(name: string): string {
  if (!name || typeof name !== 'string') return name
  return name.replace(/\s*\/\s*sprint$/i, '').trim()
}

/** Returns contextual "View X" label for grid links based on grid type */
export function getViewGridLabel(type: string | undefined): string {
  if (type === 'driver') return 'View Drivers'
  if (type === 'team') return 'View Teams'
  if (type === 'track') return 'View Tracks'
  return 'View Grid'
}
