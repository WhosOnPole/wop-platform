'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Circuit {
  id: string
  name: string
  image_url: string | null
  track_length: number | null
  built_date: string | null
  overview_text: string | null
  circuit_ref: string | null
  location: string | null
  country: string | null
  altitude: number | null
  [key: string]: any
}

export function useCircuits() {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['circuits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch circuits: ${error.message}`)
      }

      return (data || []) as Circuit[]
    },
  })
}

