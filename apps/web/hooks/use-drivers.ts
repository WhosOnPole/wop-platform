'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Driver {
  id: string
  name: string
  team_id: string | null
  image_url: string | null
  headshot_url: string | null
  team_icon_url: string | null
  active: boolean
  racing_number: number | null
  age: number | null
  nationality: string | null
  podiums_total: number
  current_standing: number | null
  world_championships: number
  teams?: {
    id: string
    name: string
    image_url: string | null
  } | null
}

export function useDrivers() {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(
          `
          *,
          teams:team_id (
            id,
            name,
            image_url
          )
        `
        )
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch drivers: ${error.message}`)
      }

      return (data || []) as Driver[]
    },
  })
}

