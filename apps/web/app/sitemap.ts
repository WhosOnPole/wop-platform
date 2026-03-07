import type { MetadataRoute } from 'next'

const BASE_URL = 'https://whosonpole.org'

/**
 * Sitemap scaffold.
 * Keep static public routes here and optionally extend with DB-backed URLs
 * (e.g., stories/articles/profiles) once you decide canonical inclusion rules.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes = [
    '/',
    '/feed',
    '/pitlane',
    '/podiums',
    '/leaderboard',
    '/terms',
    '/privacy',
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }))
}
