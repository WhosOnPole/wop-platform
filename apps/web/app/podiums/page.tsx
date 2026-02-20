import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { SpotlightTabs } from '@/components/podiums/spotlight-tabs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getCurrentWeekStart() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(today.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

function isSpotlightGridType(value: unknown): value is 'driver' | 'team' | 'track' {
  return value === 'driver' || value === 'team' || value === 'track'
}

function getSpotlightFeaturedGrid(params: { grid: unknown }) {
  const { grid } = params
  if (!grid || typeof grid !== 'object') return null
  const maybeGrid = grid as Record<string, unknown>
  const type = maybeGrid.type
  if (!isSpotlightGridType(type)) return null
  const user = maybeGrid.user as Record<string, unknown> | null | undefined
  return {
    id: String(maybeGrid.id),
    type,
    comment: typeof maybeGrid.blurb === 'string' ? maybeGrid.blurb : null,
    ranked_items: Array.isArray(maybeGrid.ranked_items) ? maybeGrid.ranked_items : [],
    updated_at: maybeGrid.updated_at != null ? String(maybeGrid.updated_at) : null,
    created_at: maybeGrid.created_at != null ? String(maybeGrid.created_at) : null,
    user: user
      ? {
          id: String(user.id),
          username: String(user.username),
          profile_image_url: typeof user.profile_image_url === 'string' ? user.profile_image_url : null,
        }
      : null,
  }
}

export default async function PodiumsPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const weekStart = await getCurrentWeekStart()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    pollsResult,
    newsStoriesResult,
    approvedUserStoriesResult,
    sponsorsResult,
    weeklyHighlightsResult,
  ] = await Promise.all([
    supabase.from('polls').select('*').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
    supabase.from('news_stories').select('*').eq('is_featured', true).order('created_at', { ascending: false }),
    supabase
      .from('user_story_submissions')
      .select('id, title, summary, content, image_url, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
    supabase.from('sponsors').select('id, name, logo_url, website_url, description').order('name'),
    supabase
      .from('weekly_highlights')
      .select(
        `
        highlighted_fan_id,
        highlighted_fan_grid_id,
        highlighted_fan:profiles!highlighted_fan_id (
          id,
          username,
          profile_image_url
        ),
        highlighted_fan_grid:grids!highlighted_fan_grid_id (
          *,
          user:profiles!user_id (
            id,
            username,
            profile_image_url
          )
        )
      `
      )
      .eq('week_start_date', weekStart)
      .single(),
  ])

  const allPolls = pollsResult.data || []
  const polls = allPolls
  const pollIds = polls.map((p) => p.id)
  let userResponses: Record<string, string> = {}
  let voteCounts: Record<string, Record<string, number>> = {}

  if (session && pollIds.length > 0) {
    const { data: responses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .eq('user_id', session.user.id)
    if (responses) {
      userResponses = responses.reduce((acc, r) => {
        acc[r.poll_id] = r.selected_option_id
        return acc
      }, {} as Record<string, string>)
    }
  }

  if (pollIds.length > 0) {
    const { data: allResponses } = await supabase
      .from('poll_responses')
      .select('poll_id, selected_option_id')
      .in('poll_id', pollIds)
    if (allResponses) {
      voteCounts = allResponses.reduce(
        (acc, response) => {
          if (!acc[response.poll_id]) acc[response.poll_id] = {}
          acc[response.poll_id][response.selected_option_id] =
            (acc[response.poll_id][response.selected_option_id] || 0) + 1
          return acc
        },
        {} as Record<string, Record<string, number>>
      )
    }
  }

  const adminPolls = polls.filter((p) => p.admin_id != null)
  const communityPolls = polls.filter((p) => p.admin_id == null)
  const newsStories = (newsStoriesResult.data || []) as Array<{
    id: string
    title: string
    image_url: string | null
    content: string
    created_at: string
  }>
  const approvedUserStories = (approvedUserStoriesResult.data || []) as Array<{
    id: string
    title: string
    summary: string | null
    content: string
    image_url: string | null
    created_at: string
  }>

  const stories = [
    ...newsStories.map((n) => ({
      id: n.id,
      title: n.title,
      image_url: n.image_url,
      content: n.content,
      created_at: n.created_at,
      href: `/story/${n.id}`,
    })),
    ...approvedUserStories.map((u) => ({
      id: u.id,
      title: u.title,
      image_url: u.image_url,
      content: u.summary ? `${u.summary}\n\n${u.content}` : u.content,
      created_at: u.created_at,
      href: `/story/${u.id}`,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const sponsors = (sponsorsResult.data || []) as Array<{
    id: string
    name: string
    logo_url: string | null
    website_url: string | null
    description: string | null
  }>
  const highlights = weeklyHighlightsResult.data
  const highlightedFan = highlights?.highlighted_fan
  const fanProfile = Array.isArray(highlightedFan) ? highlightedFan[0] : highlightedFan
  const highlightedFanNormalized = fanProfile
    ? {
        id: String(fanProfile.id),
        username: String(fanProfile.username),
        profile_image_url:
          typeof fanProfile.profile_image_url === 'string' ? fanProfile.profile_image_url : null,
      }
    : null
  const featuredGrid = getSpotlightFeaturedGrid({ grid: highlights?.highlighted_fan_grid })

  // Enrich featured grid ranked_items for GridDisplayCard
  let enrichedFeaturedGrid = featuredGrid
  if (featuredGrid) {
    const fgRanked = featuredGrid.ranked_items || []
    const fgIds = fgRanked.map((i: { id?: string }) => i.id).filter(Boolean) as string[]
    if (featuredGrid.type === 'driver' && fgIds.length > 0) {
      const { data: fgDrivers } = await supabase
        .from('drivers')
        .select('id, name, headshot_url, image_url')
        .in('id', fgIds)
      const fgDriversById = new Map((fgDrivers || []).map((d: { id: string }) => [d.id, d]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const d = fgDriversById.get(item.id) as { headshot_url?: string | null; image_url?: string | null; name?: string } | undefined
          return {
            ...item,
            name: item.name ?? d?.name ?? '',
            headshot_url: d?.headshot_url ?? null,
            image_url: d?.headshot_url ?? d?.image_url ?? null,
          }
        }),
      }
    } else if (featuredGrid.type === 'track' && fgIds.length > 0) {
      const { data: fgTracks } = await supabase
        .from('tracks')
        .select('id, name, location, country, circuit_ref')
        .in('id', fgIds)
      const fgTracksById = new Map((fgTracks || []).map((t: { id: string }) => [t.id, t]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const t = fgTracksById.get(item.id) as { location?: string | null; country?: string | null; circuit_ref?: string | null; name?: string } | undefined
          return {
            ...item,
            name: item.name ?? t?.name ?? '',
            location: t?.location ?? null,
            country: t?.country ?? null,
            circuit_ref: t?.circuit_ref ?? null,
          }
        }),
      }
    } else if (featuredGrid.type === 'team' && fgIds.length > 0) {
      const { data: fgTeams } = await supabase.from('teams').select('id, name').in('id', fgIds)
      const fgTeamsById = new Map((fgTeams || []).map((t: { id: string }) => [t.id, t]))
      enrichedFeaturedGrid = {
        ...featuredGrid,
        ranked_items: fgRanked.map((item: { id: string; name?: string }) => {
          const t = fgTeamsById.get(item.id) as { name?: string } | undefined
          return { ...item, name: item.name ?? t?.name ?? '' }
        }),
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 pt-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-white font-display">Spotlight</h1>
        <h3 className="text-sm text-white/70 font-sans mb-6">Predict. Vote. Go For Glory.</h3>
      </div>

      <SpotlightTabs
        adminPolls={adminPolls}
        communityPolls={communityPolls}
        userResponses={userResponses}
        voteCounts={voteCounts}
        stories={stories}
        sponsors={sponsors}
        highlightedFan={highlightedFanNormalized}
        featuredGrid={enrichedFeaturedGrid}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL}
      />
    </div>
  )
}
