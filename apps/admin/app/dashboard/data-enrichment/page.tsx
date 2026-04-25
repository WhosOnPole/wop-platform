import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DriversTable } from '@/components/data-enrichment/drivers-table'
import { TeamsTable } from '@/components/data-enrichment/teams-table'
import { TracksTable } from '@/components/data-enrichment/tracks-table'
import { SchedulesTable } from '@/components/data-enrichment/schedules-table'
import { AdminPageHeader } from '@/components/admin/page-header'

export default async function DataEnrichmentPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Data Management"
        title="Data Enrichment"
        description="Edit driver, team, and track data. Update enriched fields such as imagery, bios, metadata, schedules, and racing stats."
      />

      <Tabs defaultValue="drivers" className="mb-8 w-full">
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

