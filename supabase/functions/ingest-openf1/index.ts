// ============================================
// Who's on Pole? Platform - OpenF1 Data Ingestion
// ============================================
// This Edge Function fetches data from the OpenF1 API and performs
// hybrid upserts (updates only fields it controls, preserves admin data)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENF1_BASE_URL = "https://api.openf1.org/v1";

interface OpenF1Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  name: string;
  team_name?: string;
}

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  location: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
}

interface OpenF1Team {
  team_name: string;
  team_key: number;
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting OpenF1 data ingestion...");

    // ============================================
    // 1. INGEST DRIVERS
    // ============================================
    console.log("Fetching drivers from OpenF1...");
    const driversResponse = await fetch(`${OPENF1_BASE_URL}/drivers`);
    if (!driversResponse.ok) {
      throw new Error(`Failed to fetch drivers: ${driversResponse.statusText}`);
    }
    const drivers: OpenF1Driver[] = await driversResponse.json();

    console.log(`Processing ${drivers.length} drivers...`);
    for (const driver of drivers) {
      if (!driver.driver_number || !driver.full_name) {
        console.warn(`Skipping invalid driver: ${JSON.stringify(driver)}`);
        continue;
      }

      // Find team_id if team_name is provided
      let teamId: string | null = null;
      if (driver.team_name) {
        const { data: team } = await supabase
          .from("teams")
          .select("id")
          .ilike("name", `%${driver.team_name}%`)
          .limit(1)
          .single();

        if (team) {
          teamId = team.id;
        }
      }

      // Hybrid upsert: Only update fields we control from OpenF1
      // Never overwrite: age, nationality, podiums_total, world_championships, image_url, instagram_url
      const { error: driverError } = await supabase
        .from("drivers")
        .upsert(
          {
            openf1_driver_number: driver.driver_number,
            name: driver.full_name || driver.name,
            team_id: teamId,
            // Only update these if they don't exist (admin may have set them)
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "openf1_driver_number",
            ignoreDuplicates: false,
          }
        )
        .select();

      if (driverError) {
        console.error(`Error upserting driver ${driver.full_name}:`, driverError);
      }
    }

    // ============================================
    // 2. INGEST TEAMS
    // ============================================
    console.log("Fetching teams from OpenF1...");
    const teamsResponse = await fetch(`${OPENF1_BASE_URL}/teams`);
    if (!teamsResponse.ok) {
      console.warn(`Failed to fetch teams: ${teamsResponse.statusText}`);
    } else {
      const teams: OpenF1Team[] = await teamsResponse.json();
      console.log(`Processing ${teams.length} teams...`);

      for (const team of teams) {
        if (!team.team_name) {
          continue;
        }

        // Hybrid upsert: Only update name, never overwrite admin fields
        const { error: teamError } = await supabase
          .from("teams")
          .upsert(
            {
              name: team.team_name,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "name",
              ignoreDuplicates: false,
            }
          );

        if (teamError) {
          console.error(`Error upserting team ${team.team_name}:`, teamError);
        }
      }
    }

    // ============================================
    // 3. INGEST MEETINGS (RACE SCHEDULE)
    // ============================================
    console.log("Fetching meetings from OpenF1...");
    const meetingsResponse = await fetch(`${OPENF1_BASE_URL}/meetings`);
    if (!meetingsResponse.ok) {
      console.warn(`Failed to fetch meetings: ${meetingsResponse.statusText}`);
    } else {
      const meetings: OpenF1Meeting[] = await meetingsResponse.json();
      console.log(`Processing ${meetings.length} meetings...`);

      for (const meeting of meetings) {
        if (!meeting.meeting_key || !meeting.meeting_name) {
          continue;
        }

        // Generate slug from meeting name
        const slug = meeting.meeting_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Try to find matching track by name
        let trackId: string | null = null;
        if (meeting.circuit_short_name) {
          const { data: track } = await supabase
            .from("tracks")
            .select("id")
            .ilike("name", `%${meeting.circuit_short_name}%`)
            .limit(1)
            .single();

          if (track) {
            trackId = track.id;
          }
        }

        // Parse race time
        let raceTime: string | null = null;
        if (meeting.date_start) {
          raceTime = new Date(meeting.date_start).toISOString();
        }

        // Hybrid upsert: Only update OpenF1-controlled fields
        const { error: meetingError } = await supabase
          .from("race_schedule")
          .upsert(
            {
              openf1_meeting_key: meeting.meeting_key,
              name: meeting.meeting_name,
              slug: slug,
              track_id: trackId,
              race_time: raceTime,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "openf1_meeting_key",
              ignoreDuplicates: false,
            }
          );

        if (meetingError) {
          console.error(`Error upserting meeting ${meeting.meeting_name}:`, meetingError);
        }
      }
    }

    console.log("OpenF1 data ingestion completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "OpenF1 data ingestion completed",
        drivers_processed: drivers.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in OpenF1 ingestion:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

