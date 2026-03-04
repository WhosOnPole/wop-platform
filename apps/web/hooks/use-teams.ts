'use client'

import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@/utils/supabase-client'

interface Team {
  id: string
  name: string
  image_url: string | null
  overview_text: string | null
  active: boolean
  [key: string]: any
}

export function useTeams() {
  const supabase = createClientComponentClient()

  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch teams: ${error.message}`)
      }

      return (data || []) as Team[]
    },
  })
}

