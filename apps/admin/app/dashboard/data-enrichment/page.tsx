import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DriversTable } from '@/components/data-enrichment/drivers-table'
import { TeamsTable } from '@/components/data-enrichment/teams-table'
import { TracksTable } from '@/components/data-enrichment/tracks-table'

export default async function DataEnrichmentPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    }
  )

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Data Enrichment</h1>
      <p className="mb-8 text-gray-600">
        Edit driver, team, and track data. You can update enriched fields such as images, bios,
        and stats.
      </p>

      <Tabs defaultValue="drivers" className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          <DriversTable />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTable />
        </TabsContent>

        <TabsContent value="tracks">
          <TracksTable />
        </TabsContent>
      </Tabs>

    </div>
  )
}

