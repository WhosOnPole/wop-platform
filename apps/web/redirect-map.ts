export interface RedirectMatch {
  destination: string
  permanent?: boolean
}

const EXACT_REDIRECTS: Record<string, RedirectMatch> = {
  // Legacy/top-level sections now live under Pitlane tabs.
  '/tracks': { destination: '/pitlane#tracks', permanent: true },
  '/drivers': { destination: '/pitlane#drivers', permanent: true },
  '/teams': { destination: '/pitlane#teams', permanent: true },
}

const PREFIX_REDIRECTS: Array<{
  sourcePrefix: string
  destinationPrefix: string
  permanent?: boolean
}> = [
  // Scaffold for future legacy path migrations.
  // Example:
  // { sourcePrefix: '/old-blog/', destinationPrefix: '/article/', permanent: true },
]

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function matchRedirect(pathname: string): RedirectMatch | null {
  const normalizedPath = normalizePath(pathname)

  const exact = EXACT_REDIRECTS[normalizedPath]
  if (exact) return exact

  for (const rule of PREFIX_REDIRECTS) {
    if (normalizedPath.startsWith(rule.sourcePrefix)) {
      const suffix = normalizedPath.slice(rule.sourcePrefix.length)
      return {
        destination: `${rule.destinationPrefix}${suffix}`,
        permanent: rule.permanent,
      }
    }
  }

  return null
}
