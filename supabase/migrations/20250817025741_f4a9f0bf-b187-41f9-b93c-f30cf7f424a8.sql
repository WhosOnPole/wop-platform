-- Add quote_author field to drivers table
ALTER TABLE public.drivers 
ADD COLUMN quote_author TEXT;

-- Add quote_author field to teams table  
ALTER TABLE public.teams
ADD COLUMN quote_author TEXT;

-- Add quote_author field to team_principals table
ALTER TABLE public.team_principals 
ADD COLUMN quote_author TEXT;

-- Add quote_author field to tracks table
ALTER TABLE public.tracks
ADD COLUMN quote_author TEXT;