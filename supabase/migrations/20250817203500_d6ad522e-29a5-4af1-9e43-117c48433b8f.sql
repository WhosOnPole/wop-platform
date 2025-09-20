-- Add short_bio fields to drivers and teams tables
ALTER TABLE public.drivers ADD COLUMN short_bio TEXT;
ALTER TABLE public.teams ADD COLUMN short_bio TEXT;