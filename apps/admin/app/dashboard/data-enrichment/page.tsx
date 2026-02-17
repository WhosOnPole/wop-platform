import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DriversTable } from '@/components/data-enrichment/drivers-table'
import { TeamsTable } from '@/components/data-enrichment/teams-table'
import { TracksTable } from '@/components/data-enrichment/tracks-table'
import { SchedulesTable } from '@/components/data-enrichment/schedules-table'

export default async function DataEnrichmentPage() {
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
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
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

        <TabsContent value="schedules">
          <SchedulesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

