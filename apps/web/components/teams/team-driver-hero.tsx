'use client'

import { getDriverProfileImageUrl } from '@/utils/storage-urls'
import { DriverHeroPanel } from './driver-hero-panel'

interface TeamDriverHeroProps {
  team: { name: string }
  drivers: Array<{
    id: string
    name: string
    headshot_url: string | null
    image_url: string | null
  }>
  supabaseUrl: string
}

export function TeamDriverHero({
  team,
  drivers,
  supabaseUrl,
}: TeamDriverHeroProps) {
  const driverCount = drivers.length
  // Use inline style for dynamic grid columns since Tailwind JIT doesn't support dynamic class names
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${driverCount}, minmax(0, 1fr))`,
    height: '100%',
  }

  return (
    <div className="h-64 md:h-96" style={gridStyle}>
      {drivers.map((driver) => {
        const driverSlug = driver.name.toLowerCase().replace(/\s+/g, '-')
        const profileImageUrl = supabaseUrl
          ? getDriverProfileImageUrl(driver.name, supabaseUrl)
          : null

        return (
          <DriverHeroPanel
            key={driver.id}
            driver={driver}
            driverSlug={driverSlug}
            profileImageUrl={profileImageUrl}
          />
        )
      })}
    </div>
  )
}

