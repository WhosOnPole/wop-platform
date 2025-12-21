-- ============================================
-- Who's on Pole? Platform - OpenF1 Cron Job Setup
-- ============================================
-- This migration sets up a pg_cron job to run the OpenF1 ingestion function monthly
-- (on the last day of each month at 2 AM UTC)
-- 
-- Note: pg_cron must be enabled in your Supabase project first
-- Go to: Database > Extensions > Enable "pg_cron"

-- First, ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the OpenF1 ingestion to run monthly on the last day of each month at 2 AM UTC
-- The cron expression '0 2 28-31 * *' runs on days 28-31 of each month, which covers
-- the last day of every month (28 for February, 29 for leap years, 30/31 for other months)
-- This will call the Edge Function via HTTP
-- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
-- Replace 'YOUR_ANON_KEY' with your service role key (for authentication)

-- Option 1: Using Supabase Edge Function HTTP endpoint
-- Uncomment and update the URL with your project details:
/*
SELECT cron.schedule(
  'openf1-monthly-ingestion',
  '0 2 28-31 * *', -- Runs on last day of each month at 2 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-openf1',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- Option 2: Manual trigger (simpler, but requires manual execution)
-- You can manually trigger the function from Supabase Dashboard > Edge Functions > ingest-openf1 > Invoke

-- Option 3: Use Supabase's built-in scheduled functions (if available)
-- This is the recommended approach if your Supabase plan supports it

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Enable pg_cron extension:
--    - Go to Supabase Dashboard > Database > Extensions
--    - Search for "pg_cron" and enable it
--
-- 2. Get your project details:
--    - Project Reference: Found in your Supabase project URL
--      (e.g., if URL is https://abc123.supabase.co, ref is "abc123")
--    - Service Role Key: Dashboard > Settings > API > service_role key
--
-- 3. Update the cron.schedule call above with your details, then uncomment and run
--
-- 4. OR use the simpler approach: Manually trigger the function when needed
--    from Supabase Dashboard > Edge Functions > ingest-openf1 > Invoke
--
-- 5. OR set up a scheduled function in Supabase Dashboard:
--    - Go to Edge Functions > ingest-openf1
--    - Look for "Schedule" or "Cron" options
--    - Set it to run daily

