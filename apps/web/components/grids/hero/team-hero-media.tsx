'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@/utils/supabase-client'
import { getDriverBodyImageUrl } from '@/utils/storage-urls'

interface TeamHeroMediaProps {
  teamId: string
  teamName: string
  supabaseUrl?: string
  className?: string
}

export function TeamHeroMedia({
  teamId,
  teamName,
  supabaseUrl,
  className = '',
}: TeamHeroMediaProps) {
  const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('drivers')
        .select('id, name')
        .eq('team_id', teamId)
        .eq('active', true)
        .order('name')
        .limit(2)
      if (!cancelled && data) setDrivers(data)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [teamId, supabase])

  if (!supabaseUrl || drivers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-white/60 text-lg ${className}`}
        style={{ minHeight: 200 }}
      >
        {teamName}
      </div>
    )
  }

  return (
    <div
      className={`relative grid w-full h-full min-h-[220px] ${className}`}
      style={{ gridTemplateColumns: drivers.length === 1 ? '1fr' : '1fr 1fr' }}
    >
      {drivers.slice(0, 2).map((d) => (
        <div
          key={d.id}
          className="relative flex items-end justify-center min-h-0 w-full"
        >
          <div className="relative w-full h-full min-h-[220px]">
            <Image
              src={getDriverBodyImageUrl(d.name, supabaseUrl)}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 380px"
              className="object-contain object-bottom"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                if (t) t.style.display = 'none'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
