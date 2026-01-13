import 'server-only'

interface GetRecentInstagramMediaParams {
  username: string
  limit?: number
}

interface InstagramMedia {
  id: string
  permalink: string
  media_url?: string
  thumbnail_url?: string
  media_type?: string
}

export async function getRecentInstagramMedia({ username, limit = 6 }: GetRecentInstagramMediaParams) {
  const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (!accessToken || !businessAccountId) {
    throw new Error('Instagram API is not configured')
  }

  const fields = `business_discovery.username(${encodeURIComponent(
    username
  )}){media.limit(${limit}){id,media_type,media_url,thumbnail_url,permalink}}`

  const url = new URL(`https://graph.facebook.com/v18.0/${businessAccountId}`)
  url.searchParams.set('fields', fields)
  url.searchParams.set('access_token', accessToken)

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Instagram API error: ${res.status} ${body}`)
  }

  const json = (await res.json()) as any
  const media: InstagramMedia[] = json?.business_discovery?.media?.data || []

  return media
    .map((item) => {
      const imageUrl = item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url
      if (!imageUrl) return null
      return {
        id: item.id as string,
        href: item.permalink as string,
        imageUrl,
      }
    })
    .filter(Boolean) as Array<{ id: string; href: string; imageUrl: string }>
}
