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
      className={`relative flex items-center justify-center gap-2 w-full max-w-[min(85vw,360px)] h-full min-h-[200px] ${className}`}
    >
      {drivers.slice(0, 2).map((d) => (
        <div
          key={d.id}
          className="relative flex-1 h-full min-h-[180px] max-h-[min(45vh,260px)]"
        >
          <Image
            src={getDriverBodyImageUrl(d.name, supabaseUrl)}
            alt=""
            fill
            sizes="180px"
            className="object-contain object-bottom"
            onError={(e) => {
              const t = e.target as HTMLImageElement
              if (t) t.style.display = 'none'
            }}
          />
        </div>
      ))}
    </div>
  )
}
