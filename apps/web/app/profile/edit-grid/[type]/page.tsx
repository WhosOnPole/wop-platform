'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { GridEditor } from '@/components/grid-editor/grid-editor'

export default function EditGridPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const params = useParams()
  const type = params.type as 'driver' | 'team' | 'track'
  const [loading, setLoading] = useState(true)
  const [availableItems, setAvailableItems] = useState<any[]>([])

  useEffect(() => {
    if (!['driver', 'team', 'track'].includes(type)) {
      router.push('/')
      return
    }

    loadAvailableItems()
  }, [type])

  async function loadAvailableItems() {
    setLoading(true)
    
    try {
      let result
      
      if (type === 'driver') {
        result = await supabase
          .from('drivers')
          .select('id, name, image_url, team_icon_url')
          .order('name')
      } else if (type === 'team') {
        result = await supabase
          .from('teams')
          .select('id, name, image_url')
          .order('name')
      } else if (type === 'track') {
        result = await supabase
          .from('tracks')
          .select('id, name, image_url')
          .order('name')
      } else {
        setLoading(false)
        return
      }

      if (result.data) {
        setAvailableItems(
          result.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            team_icon_url: item.team_icon_url || null,
          }))
        )
      }
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Edit Your Top {type === 'driver' ? 'Drivers' : type === 'team' ? 'Teams' : 'Tracks'}{' '}
          Ranking
        </h1>
        <p className="mt-2 text-gray-600">
          Drag and drop to rank your top 10 {type === 'driver' ? 'drivers' : type === 'team' ? 'teams' : 'tracks'}
        </p>
      </div>

      <GridEditor type={type} availableItems={availableItems} />
    </div>
  )
}

