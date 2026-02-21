/** Returns contextual "View X" label for grid links based on grid type */
export function getViewGridLabel(type: string | undefined): string {
  if (type === 'driver') return 'View Drivers'
  if (type === 'team') return 'View Teams'
  if (type === 'track') return 'View Tracks'
  return 'View Grid'
}
