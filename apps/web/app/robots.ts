import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://whosonpole.org'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/coming-soon', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
