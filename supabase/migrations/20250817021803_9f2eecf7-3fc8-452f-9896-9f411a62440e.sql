-- Add quote column to drivers table
ALTER TABLE public.drivers ADD COLUMN quote TEXT;

-- Add quote column to teams table  
ALTER TABLE public.teams ADD COLUMN quote TEXT;

-- Add quote column to team_principals table
ALTER TABLE public.team_principals ADD COLUMN quote TEXT;

-- Add quote column to tracks table
ALTER TABLE public.tracks ADD COLUMN quote TEXT;