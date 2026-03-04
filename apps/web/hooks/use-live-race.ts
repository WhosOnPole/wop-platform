'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'

export interface LiveRaceInfo {
  slug: string
  name: string
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

export function useLiveRace() {
  const supabase = createClientComponentClient()
  const [liveRace, setLiveRace] = useState<LiveRaceInfo | null>(null)

  useEffect(() => {
    let isMounted = true

    async function check() {
      const { data: trackIds } = await supabase.rpc('get_track_ids_with_active_event')
      const ids = (trackIds || []) as string[]
      if (ids.length === 0) {
        if (isMounted) setLiveRace(null)
        return
      }
      const { data: tracks } = await supabase
        .from('tracks')
        .select('id, name')
        .in('id', ids)
        .limit(1)
      const track = tracks?.[0]
      if (isMounted && track) {
        setLiveRace({
          name: track.name,
          slug: slugify(track.name),
        })
      } else if (isMounted) {
        setLiveRace(null)
      }
    }

    check()
    const interval = setInterval(check, 60000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return { liveRace }
}
