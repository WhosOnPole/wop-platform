import { createClient } from '@supabase/supabase-js'
import { DriverCard } from '@/components/drivers/driver-card'

export const revalidate = 3600 // Revalidate every hour

export default async function DriversPage() {
  // Use public client for static generation (no cookies needed)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: drivers, error } = await supabase
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
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Drivers</h1>
          <p className="mt-2 text-white">
            Explore all Formula 1 drivers and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center">
          <p className="text-red-800">
            Error loading drivers. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  if (!drivers || drivers.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Drivers</h1>
          <p className="mt-2 text-white">
            Explore all Formula 1 drivers and their profiles
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">No drivers available yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Drivers</h1>
        <p className="mt-2 text-white">
          Explore all Formula 1 drivers and their profiles
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {drivers.map((driver) => {
          // Generate slug from driver name
          const slug = driver.name.toLowerCase().replace(/\s+/g, '-')
          
          return (
            <DriverCard
              key={driver.id}
              driver={driver}
              slug={slug}
            />
          )
        })}
      </div>
    </div>
  )
}
