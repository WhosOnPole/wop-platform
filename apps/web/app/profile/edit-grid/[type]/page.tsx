'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { useRouter, useParams } from 'next/navigation'
import { GridDetailView } from '@/components/grids/grid-detail-view'
import { getTeamIconUrl, getTrackSlug } from '@/utils/storage-urls'

type RankItem = {
  id: string
  name: string
  nationality?: string | null
  headshot_url?: string | null
  image_url?: string | null
  team_name?: string | null
  location?: string | null
  country?: string | null
  track_slug?: string
  is_placeholder?: boolean
}

export default function EditGridPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useParams()
  const type = params.type as 'driver' | 'team' | 'track'
  const [loading, setLoading] = useState(true)
  const [rankedList, setRankedList] = useState<RankItem[]>([])
  const [availableItems, setAvailableItems] = useState<RankItem[]>([])
  const [blurb, setBlurb] = useState('')
  const [existingGridId, setExistingGridId] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ id: string; username: string; profile_image_url: string | null } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? undefined

  function getPlaceholderItem(index: number): RankItem {
    return {
      id: `__placeholder__${index}`,
      name: '',
      is_placeholder: true,
    }
  }

  function padToTen(items: RankItem[]): RankItem[] {
    const unique: RankItem[] = []
    const seenIds = new Set<string>()
    for (const item of items) {
      if (item.is_placeholder) continue
      if (seenIds.has(item.id)) continue
      seenIds.add(item.id)
      unique.push(item)
      if (unique.length >= 10) break
    }

    const filled = unique.slice(0, 10)
    const padded: RankItem[] = []
    for (let i = 0; i < 10; i++) {
      padded.push(filled[i] ?? getPlaceholderItem(i))
    }
    return padded
  }

  useEffect(() => {
    if (!['driver', 'team', 'track'].includes(type)) {
      router.push('/')
      return
    }
    loadAll()
  }, [type])

  async function loadAll() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        setLoading(false)
        return
      }

      const [profileRes, gridRes, catalogRes] = await Promise.all([
        supabase.from('profiles').select('id, username, profile_image_url').eq('id', session.user.id).single(),
        supabase.from('grids').select('*').eq('user_id', session.user.id).eq('type', type).single(),
        loadCatalog(type),
      ])

      const profileData = profileRes.data
      const existingGrid = gridRes.data
      const catalog = catalogRes
      setAvailableItems(catalog)

      if (profileData) setProfile(profileData)
      if (existingGrid) {
        setExistingGridId(existingGrid.id)
        setBlurb(existingGrid.blurb || '')
        const rankedIds = (existingGrid.ranked_items || []) as Array<{ id: string; name: string }>
        const ordered = rankedIds
          .map((r) => catalog.find((c) => c.id === r.id))
          .filter((c): c is RankItem => !!c)
        setRankedList(padToTen(ordered))
      } else {
        setRankedList(padToTen([]))
      }
    } catch (error) {
      console.error('Error loading edit grid:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCatalog(t: 'driver' | 'team' | 'track'): Promise<RankItem[]> {
    if (t === 'driver') {
      const { data } = await supabase
        .from('drivers')
        .select('id, name, image_url, headshot_url, nationality, teams:team_id(name)')
        .eq('active', true)
        .order('name')
      return (data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        nationality: d.nationality ?? null,
        headshot_url: d.headshot_url ?? null,
        image_url: d.image_url ?? null,
        team_name: Array.isArray(d.teams) ? d.teams[0]?.name : d.teams?.name ?? null,
      }))
    }
    if (t === 'track') {
      const { data } = await supabase.from('tracks').select('id, name, location, country').order('name')
      return (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        location: t.location ?? null,
        country: t.country ?? null,
        track_slug: getTrackSlug(t.name),
      }))
    }
    const { data } = await supabase.from('teams').select('id, name').eq('active', true).order('name')
    return (data || []).map((t: any) => ({ id: t.id, name: t.name }))
  }

  async function handleSave() {
    const realItems = rankedList.filter((i) => !i.is_placeholder).slice(0, 10)
    if (realItems.length === 0) {
      alert('Please rank at least one item')
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    setIsSubmitting(true)
    const rankedItemIds = realItems.map((item) => ({ id: item.id, name: item.name }))
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    if (existingGridId) {
      const { data: currentGrid } = await supabase
        .from('grids')
        .select('ranked_items')
        .eq('id', existingGridId)
        .single()
      const previousState = currentGrid?.ranked_items || null
      const { error: updateError } = await supabase
        .from('grids')
        .update({
          ranked_items: rankedItemIds,
          blurb: blurb.trim() || null,
          previous_state: previousState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGridId)

      if (updateError) {
        console.error('Error updating grid:', updateError)
        alert('Failed to update grid')
        setIsSubmitting(false)
        return
      }
      const gridTypeLabel = type === 'driver' ? 'Drivers' : type === 'team' ? 'Teams' : 'Tracks'
      await supabase.from('posts').insert({
        user_id: session.user.id,
        content: blurb.trim() || `Updated their Top ${gridTypeLabel} grid`,
        parent_page_type: 'profile',
        parent_page_id: session.user.id,
      })
    } else {
      const { error } = await supabase.from('grids').insert({
        user_id: session.user.id,
        type,
        ranked_items: rankedItemIds,
        blurb: blurb.trim() || null,
      })
      if (error) {
        console.error('Error saving grid:', error)
        alert('Failed to save grid')
        setIsSubmitting(false)
        return
      }
    }
    router.push(`/u/${profileData?.username || session.user.id}`)
    setIsSubmitting(false)
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25B4B1] border-t-transparent" />
      </div>
    )
  }

  const gridForView = {
    id: existingGridId || '',
    type,
    ranked_items: rankedList,
    blurb: blurb || null,
    like_count: 0,
    is_liked: false,
  }

  return (
    <GridDetailView
      grid={gridForView}
      owner={profile}
      isOwnProfile
      supabaseUrl={supabaseUrl}
      mode="edit"
      rankedList={rankedList}
      onRankedListChange={setRankedList}
      blurb={blurb}
      onBlurbChange={setBlurb}
      onSave={handleSave}
      availableItems={availableItems}
    />
  )
}
