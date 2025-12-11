# OpenF1 Data Ingestion Setup Guide

This guide explains how to set up automatic monthly ingestion of F1 data from the OpenF1 API.

## Overview

The OpenF1 ingestion Edge Function fetches driver, team, and race schedule data from the OpenF1 API and syncs it to your database. The function runs automatically on the last day of each month, and can also be triggered manually from the admin panel when needed (e.g., after races).

## Option 1: Manual Trigger (Simplest - Recommended for Development)

1. **Deploy the Edge Function:**
   ```bash
   # From the project root
   supabase functions deploy ingest-openf1
   ```
   
   Or use the Supabase CLI:
   ```bash
   supabase functions deploy ingest-openf1 --project-ref YOUR_PROJECT_REF
   ```

2. **Set Environment Variables:**
   - Go to Supabase Dashboard > Edge Functions > ingest-openf1 > Settings
   - Add these secrets:
     - `SUPABASE_URL`: Your Supabase project URL (e.g., `https://abc123.supabase.co`)
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings > API)

3. **Manually Trigger:**
   - Go to Supabase Dashboard > Edge Functions > ingest-openf1
   - Click "Invoke" button
   - This will run the function immediately

**When to use:** During development, or if you only need to sync data occasionally.

## Option 2: Scheduled Function (Recommended for Production)

Supabase supports scheduled Edge Functions (if available on your plan):

1. **Deploy the function** (same as Option 1)

2. **Set up schedule:**
   - Go to Supabase Dashboard > Edge Functions > ingest-openf1
   - Look for "Schedule" or "Cron" tab/section
   - Set schedule: `0 2 28-31 * *` (runs on last day of each month at 2 AM UTC)
   - This covers the last day of every month (28 for February, 29 for leap years, 30/31 for other months)

**When to use:** Production environments where you want automatic monthly updates. For more frequent updates (e.g., after races), use the manual refresh button in the admin panel.

## Option 3: pg_cron (Advanced)

If you need more control or your plan doesn't support scheduled functions:

1. **Enable pg_cron extension:**
   - Go to Supabase Dashboard > Database > Extensions
   - Search for "pg_cron" and click "Enable"

2. **Get your project details:**
   - **Project Reference**: Found in your Supabase URL
     - Example: If URL is `https://akjgphgaisyhumgmaeqo.supabase.co`
     - Your ref is: `akjgphgaisyhumgmaeqo`
   - **Service Role Key**: Dashboard > Settings > API > service_role key

3. **Run the SQL migration:**
   - Open `supabase/migrations/003_setup_openf1_cron.sql`
   - Replace placeholders:
     - `YOUR_PROJECT_REF` → Your actual project reference
     - `YOUR_SERVICE_ROLE_KEY` → Your service role key
   - Uncomment the `cron.schedule` block
   - Run it in Supabase SQL Editor

4. **Verify the schedule:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'openf1-monthly-ingestion';
   ```

**When to use:** If you need custom scheduling or more control over the cron job.

## Option 4: External Cron Service (Alternative)

Use an external service like:
- **GitHub Actions** (if your repo is on GitHub)
- **Vercel Cron Jobs** (if deploying to Vercel)
- **Cloudflare Workers Cron Triggers** (if using Cloudflare)
- **Any cron service** that can make HTTP requests

Example GitHub Actions workflow (`.github/workflows/openf1-sync.yml`):
```yaml
name: OpenF1 Monthly Sync

on:
  schedule:
    - cron: '0 2 28-31 * *'  # Last day of each month at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger OpenF1 Ingestion
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-openf1
```

## Testing

To test the function manually:

1. **Via Supabase Dashboard:**
   - Edge Functions > ingest-openf1 > Invoke
   - Check the logs for success/errors

2. **Via curl:**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/ingest-openf1
   ```

3. **Check the results:**
   ```sql
   -- Check if drivers were imported
   SELECT COUNT(*) FROM drivers;
   
   -- Check if teams were imported
   SELECT COUNT(*) FROM teams;
   
   -- Check if races were imported
   SELECT COUNT(*) FROM race_schedule;
   ```

## Troubleshooting

**Function not found:**
- Make sure you've deployed the Edge Function first
- Check that the function name matches exactly: `ingest-openf1`

**Authentication errors:**
- Verify your service role key is correct
- Make sure it's set as a secret in Edge Function settings

**No data imported:**
- Check Edge Function logs for errors
- Verify OpenF1 API is accessible
- Check that the function has proper error handling

**Cron job not running:**
- Verify pg_cron extension is enabled
- Check cron job exists: `SELECT * FROM cron.job;`
- Check cron job history: `SELECT * FROM cron.job_run_details;`

## Recommended Approach

**For Development:**
- Use Option 1 (Manual Trigger) - simple and sufficient

**For Production:**
- Use Option 2 (Scheduled Function) if available
- Otherwise use Option 3 (pg_cron) or Option 4 (External Cron)

