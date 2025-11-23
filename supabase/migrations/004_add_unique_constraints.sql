-- ============================================
-- Who's on Pole? Platform - Add Unique Constraints for OpenF1 Upserts
-- ============================================
-- This migration adds UNIQUE constraints required for the OpenF1 ingestion Edge Function
-- to perform upserts correctly

-- Add UNIQUE constraint on drivers.openf1_driver_number
-- This allows the Edge Function to upsert drivers based on their OpenF1 driver number
DO $$ 
BEGIN
  ALTER TABLE drivers
  ADD CONSTRAINT drivers_openf1_driver_number_unique UNIQUE (openf1_driver_number);
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Add UNIQUE constraint on teams.name
-- This allows the Edge Function to upsert teams based on their name
DO $$ 
BEGIN
  ALTER TABLE teams
  ADD CONSTRAINT teams_name_unique UNIQUE (name);
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- Add UNIQUE constraint on race_schedule.openf1_meeting_key
-- This allows the Edge Function to upsert race schedules based on OpenF1 meeting key
DO $$ 
BEGIN
  ALTER TABLE race_schedule
  ADD CONSTRAINT race_schedule_openf1_meeting_key_unique UNIQUE (openf1_meeting_key);
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

