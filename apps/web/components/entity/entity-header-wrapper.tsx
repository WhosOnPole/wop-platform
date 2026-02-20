'use client'

import { useEffect, useState } from 'react'
import { EntityHeader } from './entity-header'

interface TrackEntity {
  name: string
  location?: string | null
  country?: string | null
  laps?: number | null
  turns?: number | null
}

interface TeamEntity {
  name: string
}

interface DriverEntity {
  name: string
  nationality?: string | null
  age?: number | null
  teams?: {
    id: string
    name: string
    image_url?: string | null
  } | null
}

interface Driver {
  id: string
  name: string
  headshot_url?: string | null
  image_url?: string | null
}

type EntityType = 'track' | 'team' | 'driver'

interface EntityHeaderWrapperProps {
  type: EntityType
  entity: TrackEntity | TeamEntity | DriverEntity
  drivers?: Driver[]
  supabaseUrl?: string
}

export function EntityHeaderWrapper({
  type,
  entity,
  drivers = [],
  supabaseUrl,
}: EntityHeaderWrapperProps) {
  const [scrollProgress, setScrollProgress] = useState(0)

  // Driver pages use simple page scroll; no scroll-linked parallax
  const useScrollProgress = type !== 'driver'

  useEffect(() => {
    if (!useScrollProgress) return

    function handleScroll() {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight * 0.4
      const progress = heroHeight > 0 ? Math.min(scrollY / heroHeight, 1) : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [useScrollProgress])

  return (
    <EntityHeader
      type={type}
      entity={entity}
      drivers={drivers}
      supabaseUrl={supabaseUrl}
      scrollProgress={useScrollProgress ? scrollProgress : 0}
    />
  )
}
