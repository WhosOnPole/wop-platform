'use client'

import { useEffect, useState } from 'react'
import { EntityHeader } from './entity-header'

interface TrackEntity {
  name: string
  location?: string | null
  country?: string | null
  track_length?: number | null
  turns?: number | null
  built_date?: string | null
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

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const topNavHeight = 56 // pt-14 = 3.5rem = 56px
      const heroHeight = window.innerHeight * 0.65 // 65vh for entity pages
      // Calculate when tabs become sticky - this is when content should stop scrolling
      const scrollThreshold = heroHeight - topNavHeight - 100
      const progress = Math.min(scrollY / scrollThreshold, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <EntityHeader
      type={type}
      entity={entity}
      drivers={drivers}
      supabaseUrl={supabaseUrl}
      scrollProgress={scrollProgress}
    />
  )
}
