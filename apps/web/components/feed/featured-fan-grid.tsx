import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { FeaturedGridSocial } from './featured-grid-social'

interface FeaturedFanGridProps {
  highlightedFan: {
    id: string
    username: string
    profile_image_url: string | null
  }
}

export async function FeaturedFanGrid({ highlightedFan }: FeaturedFanGridProps) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  // Fetch the most recent driver grid for the highlighted fan
  const { data: driverGrid } = await supabase
    .from('grids')
    .select('*')
    .eq('user_id', highlightedFan.id)
    .eq('type', 'driver')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!driverGrid || !Array.isArray(driverGrid.ranked_items) || driverGrid.ranked_items.length === 0) {
    return null
  }

  // Fetch grid like count
  const { data: likeCountData } = await supabase.rpc('get_grid_like_count', {
    grid_uuid: driverGrid.id,
  })

  const likeCount = typeof likeCountData === 'number' ? likeCountData : 0

  const topThree = driverGrid.ranked_items.slice(0, 3)
  const rest = driverGrid.ranked_items.slice(3, 10)

  // Fetch driver images and details for top 3
  const driverDetails = await Promise.all(
    topThree.map(async (item: any) => {
      if (item.id) {
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, name, image_url, headshot_url, racing_number')
          .eq('id', item.id)
          .eq('active', true)
          .maybeSingle()
        if (driver) {
          return {
            ...driver,
            image_url: driver.headshot_url || driver.image_url,
            number: driver.racing_number,
          }
        }
      }
      return { name: item.name, image_url: null, number: null }
    })
  )

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Featured Grid Of The Day</h2>
        <p className="text-pink-600 font-medium">
          <Link href={`/u/${highlightedFan.username}`} className="hover:underline">
            {highlightedFan.username}&apos;s Grid
          </Link>
        </p>
        {driverGrid.blurb && (
          <p className="text-sm text-gray-600 mt-2">{driverGrid.blurb}</p>
        )}
      </div>

      {/* Top 3 Drivers - Large Cards */}
      <div className="grid grid-cols-3 gap-2  mb-4">
        {topThree.map((item: any, index: number) => {
          const driver = driverDetails[index]
          const position = index + 1
          // Color scheme based on position (you can customize these)
          const bgColor = position === 1 ? 'bg-orange-600' : position === 2 ? 'bg-teal-600' : 'bg-orange-600'
          
          return (
            <div
              key={item.id || index}
              className={`${bgColor} rounded-lg aspect-square text-white relative overflow-hidden`}
            >
              {/* Position number */}
              <div className="absolute top-2 left-2 text-white font-bold text-lg z-20">
                {position}.
              </div>
              
              {/* Driver number in background */}
              {driver?.number && (
                <div className="absolute top-0 right-0 text-white/20 text-6xl font-bold z-0">
                  {driver.number}
                </div>
              )}

              {/* Driver image - fills the entire card */}
              <div className="absolute inset-0 z-10">
                {driver?.image_url ? (
                  <Image
                    src={driver.image_url}
                    alt={driver.name || item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/20">
                    <span className="text-4xl">🏎️</span>
                  </div>
                )}
              </div>

              {/* Driver name - overlapped at bottom with translucent black background */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 z-20">
                <div className="text-center font-semibold text-white text-xs">
                  {(() => {
                    const fullName = driver?.name || item.name || 'Unknown'
                    const nameParts = fullName.split(' ')
                    if (nameParts.length > 1) {
                      const firstName = nameParts[0]
                      const lastName = nameParts.slice(1).join(' ')
                      return (
                        <>
                          <div className="truncate">{firstName}</div>
                          <div className="truncate">{lastName}</div>
                        </>
                      )
                    }
                    return <div className="truncate">{fullName}</div>
                  })()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Positions 4-10 - Smaller Cards Row */}
      {rest.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {rest.map((item: any, index: number) => {
            const position = index + 4
            return (
              <div
                key={item.id || index}
                className="flex-shrink-0 bg-orange-600 rounded-lg p-2 text-white relative overflow-hidden w-20 h-20"
              >
                {/* Position number */}
                <div className="absolute top-1 left-1 text-white font-bold text-xs z-10">
                  {position}.
                </div>
                
                {/* Driver number in background */}
                <div className="absolute top-0 right-0 text-white/20 text-3xl font-bold">
                  3
                </div>
                
                {/* Placeholder silhouette */}
                <div className="flex items-center justify-center h-full pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>

                {/* Driver name placeholder */}
                <div className="absolute bottom-1 left-1 right-1 text-center z-10">
                  <div className="text-xs text-white truncate">
                    {item.name || 'Unknown'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Social Interaction */}
      <FeaturedGridSocial gridId={driverGrid.id} initialLikeCount={likeCount} />
    </div>
  )
}

