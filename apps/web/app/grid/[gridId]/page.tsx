import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { GridDetailView } from '@/components/grids/grid-detail-view'
import { getTrackSlug } from '@/utils/storage-urls'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: Promise<{ gridId: string }>
}

export default async function GridPage({ params }: PageProps) {
  const { gridId } = await params
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined

  const { data: grid, error: gridError } = await supabase
    .from('grids')
    .select('*')
    .eq('id', gridId)
    .single()

  if (gridError || !grid) notFound()

  const { data: owner } = await supabase
    .from('profiles')
    .select('id, username, profile_image_url')
    .eq('id', grid.user_id)
    .single()

  if (!owner) notFound()

  const { count: likeCount } = await supabase
    .from('grid_likes')
    .select('*', { count: 'exact', head: true })
    .eq('grid_id', grid.id)

  const {
    data: { session },
  } = await supabase.auth.getSession()
  let isLiked = false
  if (session) {
    const { data: like } = await supabase
      .from('grid_likes')
      .select('id')
      .eq('grid_id', grid.id)
      .eq('user_id', session.user.id)
      .maybeSingle()
    isLiked = !!like
  }

  const rankedItems = Array.isArray(grid.ranked_items) ? grid.ranked_items : []
  let enrichedItems: any[] = []

  if (grid.type === 'driver') {
    const ids = rankedItems.map((r: { id: string }) => r.id)
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, name, nationality, headshot_url, image_url, team_id, teams:team_id(name)')
      .in('id', ids)
      .eq('active', true)
    const driverMap = new Map((drivers || []).map((d: any) => [d.id, d]))
    enrichedItems = rankedItems.map((r: { id: string; name: string }) => {
      const d = driverMap.get(r.id) as { teams?: { name?: string } | { name?: string }[] } | undefined
      const teamName = d?.teams
        ? (Array.isArray(d.teams) ? d.teams[0]?.name : d.teams.name)
        : null
      return {
        id: r.id,
        name: r.name,
        nationality: (d as any)?.nationality ?? null,
        headshot_url: (d as any)?.headshot_url ?? null,
        image_url: (d as any)?.image_url ?? null,
        team_name: teamName ?? null,
      }
    })
  } else if (grid.type === 'track') {
    const ids = rankedItems.map((r: { id: string }) => r.id)
    const { data: tracks } = await supabase
      .from('tracks')
      .select('id, name, location, country, circuit_ref')
      .in('id', ids)
    const trackMap = new Map((tracks || []).map((t: any) => [t.id, t]))
    enrichedItems = rankedItems.map((r: { id: string; name: string }) => {
      const t = trackMap.get(r.id)
      const name = t?.name ?? r.name
      return {
        id: r.id,
        name,
        location: t?.location ?? null,
        country: t?.country ?? null,
        circuit_ref: t?.circuit_ref ?? null,
        track_slug: getTrackSlug(name),
      }
    })
  } else if (grid.type === 'team') {
    enrichedItems = rankedItems.map((r: { id: string; name: string }) => ({
      id: r.id,
      name: r.name,
    }))
  }

  const { data: slotBlurbsRows } = await supabase
    .from('grid_slot_blurbs')
    .select('rank_index, content')
    .eq('grid_id', grid.id)

  const slotBlurbs: Record<number, string> = {}
  for (let r = 1; r <= 10; r++) slotBlurbs[r] = ''
  ;(slotBlurbsRows ?? []).forEach((row: { rank_index: number; content: string }) => {
    slotBlurbs[row.rank_index] = row.content ?? ''
  })

  const gridWithLikes = {
    ...grid,
    ranked_items: enrichedItems,
    like_count: likeCount ?? 0,
    is_liked: isLiked,
    slotBlurbs,
  }

  return (
    <GridDetailView
      grid={gridWithLikes}
      owner={{ id: owner.id, username: owner.username, profile_image_url: owner.profile_image_url }}
      isOwnProfile={!!session && session.user.id === owner.id}
      supabaseUrl={supabaseUrl}
      mode="view"
    />
  )
}
